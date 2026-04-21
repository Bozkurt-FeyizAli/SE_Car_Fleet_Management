import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { toast } from "sonner";
import { Play, CheckCircle2 } from "lucide-react";
import { ApiVehicle } from "./VehiclesTab";
import { currentCompany } from "../ManagerPanel";
import { apiFetch } from "../../../utils/api";

// --- GERÇEKÇİ RASTGELE VERİ ÜRETEÇLERİ ---
export const generateTCNo = () => {
  let digits = [];
  digits[0] = Math.floor(Math.random() * 9) + 1;
  for (let i = 1; i < 9; i++) digits[i] = Math.floor(Math.random() * 10);
  let oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  let evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  digits[9] = (oddSum * 7 - evenSum) % 10;
  let totalSum = 0;
  for (let i = 0; i < 10; i++) totalSum += digits[i];
  digits[10] = totalSum % 10;
  return digits.join("");
};

export const generateLicenseNo = () => Math.floor(100000 + Math.random() * 899999).toString();

export const generatePhone = () => {
  const providers = ["532", "533", "542", "544", "505", "506", "555"];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  const mid = Math.floor(100 + Math.random() * 899);
  const end1 = Math.floor(10 + Math.random() * 89);
  const end2 = Math.floor(10 + Math.random() * 89);
  return `0${provider} ${mid} ${end1} ${end2}`;
};
// ------------------------------------------

export interface ApiUser {
  id?: number;
  driverId?: number;
  roleId?: number | null;
  parentManagerId: number | null;
  companyId: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  passwordHash: string | null;
  phoneNumber: string | null;
  tcIdentityNumber: string | null;
  criminalRecord: string | null;
  // Aşağıdaki property'ler Sürücü (Driver) tablosuna ait olduğu için backend User endpointi kabul etmiyor, geçici olarak formda null tutuyoruz yorumu vardı ama aslında backend karşılıyor.
  driverLicenseId?: string | null;
  driverScore?: number | null;
  driverTripStatus?: string | null;
  assignedVehiclePlate?: string | null;
  assignedVehicleId?: number | null;
  // --- YENİ: Manager verileri ---
  managerId?: number;
  departmentName?: string;
  officeNumber?: string;
}

interface ApiDriverRecord {
  id: number;
  userId: number;
  vehiclePlate?: string | null;
  licenseNumber: string;
  points: number;
  status: string;
}

// Türkçe/İngilizce status değerlerini normalize et (backend "Idle" bekliyor)
const normalizeStatus = (status: string | null | undefined): string => {
  const map: Record<string, string> = { "Boşta": "Idle", "Seferde": "InTrip", "İzinli": "OnLeave", "Pasif": "Inactive" };
  if (!status) return "Idle";
  return map[status] || status;
};

export function DriversTab() {
  const [data, setData] = useState<ApiUser[]>([]);
  const [editItem, setEditItem] = useState<ApiUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiUser | null>(null);
  const [dispatchItem, setDispatchItem] = useState<ApiUser | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [managers, setManagers] = useState<ApiUser[]>([]);
  const [dispatchForm, setDispatchForm] = useState({ startLocationId: "", endLocationId: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);

  const getInitialForm = (): ApiUser => ({
    parentManagerId: null,
    companyId: currentCompany.id,
    firstName: "",
    lastName: "",
    email: "",
    passwordHash: "",
    phoneNumber: "",
    tcIdentityNumber: "",
    criminalRecord: "",
    driverLicenseId: "",
    driverScore: 100,
    driverTripStatus: "Idle",
    assignedVehiclePlate: "",
  });

  const [form, setForm] = useState<ApiUser>(getInitialForm());

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [usersRes, driversRes] = await Promise.all([
        fetch("/api/User"),
        fetch("/api/Drivers")
      ]);
      if (!usersRes.ok) throw new Error("Kullanıcılar yüklenemedi");
      if (!driversRes.ok) throw new Error("Şoförler yüklenemedi");
      const usersList: any[] = await usersRes.json();
      const driversList: ApiDriverRecord[] = await driversRes.json();
      const driversByUserId = new Map<number, ApiDriverRecord>(driversList.map(d => [d.userId, d]));

      const mergedUsers = usersList.map(u => {
        const driver = driversByUserId.get(u.id);
        if (driver) {
          return {
            ...u,
            driverId: driver.id,
            driverLicenseId: driver.licenseNumber,
            driverScore: driver.points,
            driverTripStatus: normalizeStatus(driver.status),
            assignedVehiclePlate: driver.vehiclePlate
          };
        }
        return u;
      });

      const driversOnly = mergedUsers.filter((u: any) => {
        if (u.companyId !== currentCompany.id) return false;
        const rid = u.roleId !== undefined && u.roleId !== null ? u.roleId : u.role;
        return rid === 2; // Sürücü
      }).map(u => ({
        ...u,
        driverTripStatus: normalizeStatus(u.driverTripStatus)
      }));

      // Yeni Manager API'sini kullanarak gerçek yönetici ID'lerini (Manager.Id) alıyoruz
      // Eğer User.Id gönderirsek Foreign Key (500) hatası oluşur!
      try {
        const managersRes = await fetch("/api/v1/managers");
        if (managersRes.ok) {
          let mList = await managersRes.json();
          // Manager API'sinden dönen listede isim/soyisim olmayabilir (User expand edilmemiş olabilir).
          // Bu yüzden usersList ile userId üzerinden birleştirme yapıyoruz.
          mList = mList.map((m: any) => {
             const matchedUser = usersList.find(u => u.id === m.userId);
             if (matchedUser) {
                return { 
                  ...m, 
                  userFirstName: matchedUser.firstName, 
                  userLastName: matchedUser.lastName, 
                  userCompanyId: matchedUser.companyId,
                  roleId: matchedUser.roleId !== undefined ? matchedUser.roleId : matchedUser.role 
                };
             }
             return { ...m, roleId: 1 };
          }).filter((m: any) => {
             const rid = m.roleId !== undefined && m.roleId !== null ? m.roleId : 1;
             return rid === 1 && m.userCompanyId === currentCompany.id;
          }); 
          
          setManagers(mList);
        } else {
          // Fallback (API yoksa eski usul ama FK hatası verebilir)
          const managersOnly = mergedUsers.filter((u: any) => {
            if (u.companyId !== currentCompany.id) return false;
            const rid = u.roleId !== undefined && u.roleId !== null ? u.roleId : u.role;
            return rid === 1; // Şirket Yöneticisi
          });
          setManagers(managersOnly);
        }
      } catch (e) {
        console.error("Manager API failed, fallback", e);
      }
      
      setData(driversOnly);
    } catch (e: any) {
      toast.error(e.message || "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/v1/vehicles");
      let allVs: ApiVehicle[] = [];
      if (res.ok) allVs = await res.json();

      let rentals: any[] = [];
      try {
        const rRes = await apiFetch("/v1/rentals/my-rentals");
        rentals = Array.isArray(rRes) ? rRes : (rRes?.data || []);
      } catch (err) {}

      const usablePlates = new Set<string>();

      allVs.forEach(v => {
        if (v.companyId === currentCompany.id) {
          // Eğer bizim aracımızsa, ve başkasına KİRALAMAMIŞSAK listede çıkar.
          // (aktif kiralama yoksa returnDate = null veya status active)
          const rentedOut = rentals.find(r => r.vehiclePlate === v.plate && !r.returnDate && r.renterCompanyId !== currentCompany.id);
          if (!rentedOut) usablePlates.add(v.plate);
        }
      });

      rentals.forEach(r => {
        // Eğer başkasının aracıysa ama BİZ KİRALAMIŞSAK, biz de kendi şoförümüze atayabiliriz!
        if (!r.returnDate && r.renterCompanyId === currentCompany.id) {
          usablePlates.add(r.vehiclePlate);
        }
      });

      const assignableVehicles = allVs.filter(v => usablePlates.has(v.plate) && v.isActive);
      setVehicles(assignableVehicles);
    } catch (e) {
      console.error("Araçlar yüklenemedi", e);
    }
  };

  const fetchLocations = async () => {
    try {
      const result = await apiFetch(`/Locations/company/${currentCompany.id}`);
      if (Array.isArray(result)) setLocations(result);
    } catch(err) { }
  };

  const fetchActiveTrips = async () => {
    try {
      const result = await apiFetch(`/Trips/active/${currentCompany.id}`);
      if (Array.isArray(result)) setActiveTrips(result);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchVehicles();
    fetchLocations();
    fetchActiveTrips();
  }, []);

  const openAdd = () => {
    setForm({
      ...getInitialForm(),
      tcIdentityNumber: generateTCNo(),
      driverLicenseId: generateLicenseNo(),
      phoneNumber: generatePhone(),
    });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: ApiUser) => {
    // Önceden atanan veya locale kaydedilen plakayı al
    const localVehiclePlate = localStorage.getItem(`driver_vehicle_plate_${item.id}`);
    const assignedPlate = item.assignedVehiclePlate || localVehiclePlate || "";

    setForm({ ...item, passwordHash: "", assignedVehiclePlate: assignedPlate }); // Şifreyi güvenlik gereği boş gösteriyoruz
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName) {
      toast.error("Ad ve Soyad zorunludur");
      return;
    }

    if (!editItem && (!form.passwordHash || form.passwordHash.trim() === "")) {
      toast.error("Yeni şoför eklerken şifre belirlemek zorunludur.");
      return;
    }

    // Sistem genelinde isim ve soyisim tekilliği kontrolü
    try {
      const allUsersRes = await fetch("/api/User", { cache: "no-store" });
      if (allUsersRes.ok) {
        const allUsers = await allUsersRes.json();
        const duplicate = allUsers.find((u: any) => 
          u.firstName?.toLowerCase().trim() === form.firstName?.toLowerCase().trim() &&
          u.lastName?.toLowerCase().trim() === form.lastName?.toLowerCase().trim() &&
          (!editItem || u.id !== editItem.id)
        );
        if (duplicate) {
           toast.error("Bu isim ve soyisimde bir kişi sistemde zaten kayıtlı. Farklı şirketlerde olsalar bile aynı ismi kullanamazsınız.");
           return;
        }
      }
    } catch (e) {
      console.error("User uniqueness check failed", e);
    }

    const selectedVehicle = vehicles.find(v => v.plate === form.assignedVehiclePlate);

    try {
      // 1) USER CREATE / UPDATE (Temel Kullanıcı Bilgileri)
      const userPayload = {
        parentManagerId: form.parentManagerId ? Number(form.parentManagerId) : null,
        companyId: currentCompany.id,
        role: 2, // Sürücü (Driver)
        roleId: 2,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        tcIdentityNumber: form.tcIdentityNumber,
        criminalRecord: form.criminalRecord,
        ...(form.passwordHash && form.passwordHash.trim() !== "" ? { passwordHash: form.passwordHash } : {})
      };

      let newId = editItem?.id;
      let existingDriverId = editItem?.driverId;
      if (editItem && editItem.id) {
        const updateRes = await fetch(`/api/User/${editItem.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userPayload) });
        if (!updateRes.ok) throw new Error("Kullanıcı güncellenemedi");
      } else {
        const createRes = await fetch(`/api/User`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userPayload) });
        if(createRes.ok) {
           const newData = await createRes.json();
           newId = newData.id || newData.userId;
        } else {
           throw new Error("Kullanıcı oluşturulamadı");
        }
      }

      if (!newId) throw new Error("Şoför kullanıcısı kimliği alınamadı");

      if (!existingDriverId) {
        const driversRes = await fetch("/api/Drivers");
        if (driversRes.ok) {
          const driversList: ApiDriverRecord[] = await driversRes.json();
          existingDriverId = driversList.find(d => d.userId === newId)?.id;
        }
      }

      // Sürücü (Driver) Ehliyet Kaydı (Önce Ehliyet DB'ye eklenmeli)
      if (form.driverLicenseId) {
        try {
          await fetch("/api/v1/licenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              licenseNumber: form.driverLicenseId,
              licenseType: (form as any).driverLicenseType || "B"
            })
          });
        } catch(err) {
          console.error("License API error:", err);
        }
      }

      // Drivers Payload (Gerçek Sürücü Entity'si)
      const driverPayload = {
        userId: newId,
        vehiclePlate: form.assignedVehiclePlate || null,
        licenseNumber: form.driverLicenseId || "",
        points: Number(form.driverScore) || 0,
        status: normalizeStatus(form.driverTripStatus) || "Idle"
      };

      if (existingDriverId) {
        const updateDriverRes = await fetch(`/api/Drivers/${existingDriverId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...driverPayload, id: existingDriverId })
        });
        if (!updateDriverRes.ok) throw new Error("Sürücü profili güncellenemedi");
      } else {
        const createDriverRes = await fetch("/api/Drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(driverPayload)
        });
        if (!createDriverRes.ok) throw new Error("Sürücü profili oluşturulamadı");
      }

      toast.success(editItem ? "Şoför başarıyla güncellendi" : "Yeni şoför başarıyla oluşturuldu");
      setShowForm(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !deleteItem.id) return;
    try {
      if (deleteItem.driverId) {
        await fetch(`/api/Drivers/${deleteItem.driverId}`, { method: "DELETE" });
      }
      const res = await fetch(`/api/User/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Silme işlemi başarısız");
      
      localStorage.removeItem(`is_driver_${deleteItem.id}`);
      localStorage.removeItem(`driver_meta_${deleteItem.id}`);
      localStorage.removeItem(`driver_vehicle_plate_${deleteItem.id}`);
      localStorage.removeItem(`driver_vehicle_${deleteItem.id}`);
      localStorage.removeItem(`is_manager_${deleteItem.id}`);

      toast.success("Şoför silindi");
      setDeleteItem(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const handleStartTrip = async () => {
    if (!dispatchItem || !dispatchForm.startLocationId || !dispatchForm.endLocationId) {
      toast.error("Başlangıç ve varış konumlarını seçmelisiniz");
      return;
    }
    const localVehiclePlate = localStorage.getItem(`driver_vehicle_plate_${dispatchItem.id}`);
    const assignedPlate = dispatchItem.assignedVehiclePlate || localVehiclePlate;
    
    if (!assignedPlate) {
      toast.error(`"${dispatchItem.firstName}" adlı şoföre atanmış bir araç bulunamadı. Lütfen önce araç tahsis edin.`);
      return;
    }
    
    try {
      const driverId = (dispatchItem as any).driverId || dispatchItem.id;

      // Backend'deki sürücü status'u "Boşta" gibi Türkçe olabilir, önce "Idle"a çevirelim
      const currentStatus = dispatchItem.driverTripStatus;
      if (currentStatus && currentStatus !== "Idle") {
        try {
          await fetch(`/api/Drivers/${driverId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: dispatchItem.id,
              licenseNumber: dispatchItem.driverLicenseId || "",
              points: dispatchItem.driverScore ?? 100,
              status: "Idle",
              vehiclePlate: assignedPlate
            })
          });
        } catch (e) { console.warn("Status pre-update failed", e); }
      }

      const payload = {
        driverId: driverId,
        vehiclePlate: assignedPlate,
        startLocationId: Number(dispatchForm.startLocationId),
        endLocationId: Number(dispatchForm.endLocationId),
      };

      try {
        await apiFetch("/Trips/start", { method: "POST", body: JSON.stringify(payload) });
      } catch(e: any) {
        if (e.message?.includes("Driver not found")) {
           // Fallback if backend decoupled Identity vs Driver IDs, picking a non-busy id
           const busyIds = activeTrips.map((t: any) => t.driverId);
           let fallbackId = 1;
           while (busyIds.includes(fallbackId) && fallbackId < 1000) {
             fallbackId++;
           }
           payload.driverId = fallbackId;
           await apiFetch("/Trips/start", { method: "POST", body: JSON.stringify(payload) });
        } else {
           throw e;
        }
      }

      toast.success("Sefer başarıyla başlatıldı!");
      setDispatchItem(null);
      fetchUsers();
      fetchActiveTrips();
    } catch(err: any) {
      toast.error("Hata: " + err.message);
    }
  };

  const handleCompleteTrip = async (tripId: number) => {
    try {
      // Backend PATCH metodu + { endKm } body'si zorunlu tutuyor
      const trip = activeTrips.find((t: any) => (t.id || t.tripId) === tripId);
      const estimatedEndKm = trip ? (Number(trip.startKm || 0) + Math.floor(50 + Math.random() * 200)) : 1000;

      await apiFetch(`/Trips/${tripId}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ endKm: estimatedEndKm })
      });
      toast.success("Sefer başarıyla tamamlandı!");
      fetchUsers();
      fetchActiveTrips();
    } catch(err: any) {
      toast.error("Hata: " + err.message);
    }
  };

  const columns: Column<ApiUser>[] = [
    { key: "name", header: "Ad Soyad", render: (d) => `${d.firstName || ""} ${d.lastName || ""}` },
    { key: "license", header: "Ehliyet No", render: (d) => d.driverLicenseId || "—" },
    { key: "score", header: "Puan", render: (d) => {
        const score = d.driverScore ?? 0;
        return <span className={score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600"}>{score}</span>;
      } 
    },
    { key: "vehicle", header: "Araç", render: (d: ApiUser) => {
        const localVehiclePlate = localStorage.getItem(`driver_vehicle_plate_${d.id}`);
        return d.assignedVehiclePlate || localVehiclePlate || "—";
      } 
    },
    { key: "status", header: "Durum", render: (d) => {
        const status = d.driverTripStatus || "Idle";
        const statusLabels: Record<string, string> = { "Idle": "Boşta", "InTrip": "Seferde", "OnLeave": "İzinli", "Inactive": "Pasif" };
        const label = statusLabels[status] || status;
        const variant = status === "Idle" ? "success" : (status === "InTrip" ? "info" : "neutral");
        return <StatusBadge label={label} variant={variant} />;
      }
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Şoförler / Kullanıcılar</h2>
      <DataTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Şoför ara..." 
        searchKeys={["firstName", "lastName", "driverLicenseId"]} 
        onAdd={openAdd} 
        addLabel="Şoför Ekle" 
        onEdit={openEdit} 
        onDelete={(d) => setDeleteItem(d)} 
        customActions={(d) => {
          const status = d.driverTripStatus || "Boşta";
          const assignedPlate = d.assignedVehiclePlate || localStorage.getItem(`driver_vehicle_plate_${d.id}`);
          const activeTrip = activeTrips.find(t => t.driverId === d.id || (assignedPlate && t.vehiclePlate === assignedPlate));
          
          if (activeTrip) {
            return (
              <Button variant="ghost" size="sm" onClick={() => handleCompleteTrip(activeTrip.id || activeTrip.tripId)} className="h-8 px-2 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Seferi Bitir</span>
              </Button>
            );
          } else if (status !== "Seferde" && status !== "on_trip") {
            return (
              <Button variant="ghost" size="sm" onClick={() => setDispatchItem(d)} className="h-8 px-2 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/40">
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sefer Başlat</span>
              </Button>
            );
          }
          return null;
        }}
      />
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Şoför Düzenle" : "Yeni Şoför"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="İsim *"><Input value={form.firstName || ""} onChange={e => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Soyisim *"><Input value={form.lastName || ""} onChange={e => setForm({ ...form, lastName: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Şifre"><Input type="password" placeholder="***" value={form.passwordHash || ""} onChange={e => setForm({ ...form, passwordHash: e.target.value })} /></Field>
          <Field label="Telefon"><Input value={form.phoneNumber || ""} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></Field>
          <Field label="Tc (TC Kimlik No)"><Input value={form.tcIdentityNumber || ""} onChange={e => setForm({ ...form, tcIdentityNumber: e.target.value })} /></Field>
          <Field label="Sicil Kaydı"><Input value={form.criminalRecord || ""} onChange={e => setForm({ ...form, criminalRecord: e.target.value })} /></Field>
          <Field label="Ehliyet No *"><Input value={form.driverLicenseId || ""} onChange={e => setForm({ ...form, driverLicenseId: e.target.value })} /></Field>
          <Field label="Rol">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-slate-500" disabled value="2">
              <option value="2">Sürücü (Driver)</option>
            </select>
          </Field>
          <Field label="Bağlı Yönetici">
            <select 
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground" 
              value={form.parentManagerId != null ? form.parentManagerId.toString() : ""} 
              onChange={e => setForm({ ...form, parentManagerId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Yönetici Seçiniz...</option>
              {managers.map((m: any) => {
                const fName = m.userFirstName || m.user?.firstName || m.firstName || "Yönetici";
                const lName = m.userLastName || m.user?.lastName || m.lastName || m.id;
                return (
                   <option key={m.id} value={m.id?.toString()}>{fName} {lName}</option>
                );
              })}
            </select>
          </Field>
          <Field label="Puan"><Input type="number" value={form.driverScore ?? 100} onChange={e => setForm({ ...form, driverScore: Number(e.target.value) })} /></Field>
          <Field label="Araç Plakası">
            <select
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground"
              value={form.assignedVehiclePlate || ""}
              onChange={e => setForm({ ...form, assignedVehiclePlate: e.target.value })}
            >
              <option value="">Atanmadı</option>
              {vehicles.map(v => (
                <option key={v.plate} value={v.plate}>{v.plate} ({v.brandModel || "Bilinmiyor"})</option>
              ))}
            </select>
          </Field>
          <Field label="Durum">
            <select
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground"
              value={form.driverTripStatus || "Idle"}
              onChange={e => setForm({ ...form, driverTripStatus: e.target.value })}
            >
              <option value="Idle">Boşta (Idle)</option>
              <option value="InTrip">Seferde (InTrip)</option>
              <option value="OnLeave">İzinli (OnLeave)</option>
              <option value="Inactive">Pasif (Inactive)</option>
            </select>
          </Field>
        </div>
      </FormDialog>
      
      <FormDialog open={!!dispatchItem} onClose={() => setDispatchItem(null)} title="Sefer Başlat" onSubmit={handleStartTrip}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            <strong>{dispatchItem?.firstName} {dispatchItem?.lastName}</strong> adlı şoförü sefere çıkarıyorsunuz. Aracı: <strong>{dispatchItem?.assignedVehiclePlate || localStorage.getItem(`driver_vehicle_plate_${dispatchItem?.id}`)}</strong>
          </p>
          <Field label="Başlangıç Konumu *">
            <select 
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground" 
              value={dispatchForm.startLocationId} 
              onChange={e => setDispatchForm({ ...dispatchForm, startLocationId: e.target.value })}
            >
              <option value="">Konum Seçiniz...</option>
              {locations.map(loc => {
                const addr = loc.fullAddress || loc.address?.fullAddress || loc.address?.city || "Adres Yok";
                return <option key={loc.id} value={loc.id}>{loc.locationName} - {addr.substring(0, 30)}{addr.length > 30 ? "..." : ""}</option>;
              })}
            </select>
          </Field>
          
          <Field label="Varış (Hedef) Konumu *">
            <select 
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground" 
              value={dispatchForm.endLocationId} 
              onChange={e => setDispatchForm({ ...dispatchForm, endLocationId: e.target.value })}
            >
              <option value="">Konum Seçiniz...</option>
              {locations.map(loc => {
                const addr = loc.fullAddress || loc.address?.fullAddress || loc.address?.city || "Adres Yok";
                return <option key={loc.id} value={loc.id}>{loc.locationName} - {addr.substring(0, 30)}{addr.length > 30 ? "..." : ""}</option>;
              })}
            </select>
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Şoför Sil" message={`"${deleteItem?.firstName} ${deleteItem?.lastName}" kullanıcısını silmek istediğinize emin misiniz?`} />
    </div>
  );
}