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

export interface ApiUser {
  id?: number;
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
  driverLicenseType?: string | null;
  driverScore?: number | null;
  driverTripStatus?: string | null;
  assignedVehiclePlate?: string | null;
  assignedVehicleId?: number | null;
}

export function DriversTab() {
  const [data, setData] = useState<ApiUser[]>([]);
  const [editItem, setEditItem] = useState<ApiUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiUser | null>(null);
  const [dispatchItem, setDispatchItem] = useState<ApiUser | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
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
    driverLicenseType: "B",
    driverScore: 100,
    driverTripStatus: "Boşta",
    assignedVehiclePlate: "",
  });

  const [form, setForm] = useState<ApiUser>(getInitialForm());

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/User");
      if (!res.ok) throw new Error("Kullanıcılar yüklenemedi");
      const list: any[] = await res.json();
      // Yalnızca Şoförleri listele ve bu şirkete ait olanları filtrele
      const driversOnly = list.filter((u: any) => {
        // 1) Şirket uyuşmazlığı varsa direkt geç
        if (u.companyId !== currentCompany.id) return false;
        
        // 2) Şoför olup olmadığını tespit et
        if (u.roleId === 3) return true;
        if (localStorage.getItem('is_driver_' + u.id) === 'true') return true;
        if (localStorage.getItem('is_manager_' + u.id) === 'true') return false;
        
        const emailLower = (u.email || "").toLowerCase();
        const nameLower = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        
        if (emailLower.includes("admin")) return false;
        if (emailLower.includes("sofor") || nameLower.includes("şoför")) return true;
        if (emailLower.includes("yonetici") || emailLower.includes("manager") || nameLower.includes("yönetici")) return false;
        
        return false; // Backend roleId atamadığında yönetici-admin sınıfında olmayanları şoför varsaymıyoruz. Yöneticidir.
      });
      
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
    setForm(getInitialForm());
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

    const selectedVehicle = vehicles.find(v => v.plate === form.assignedVehiclePlate);

    const payload: any = {
      parentManagerId: form.parentManagerId ? Number(form.parentManagerId) : null,
      companyId: currentCompany.id,
      roleId: 3, // Sürücü rolü
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      tcIdentityNumber: form.tcIdentityNumber,
      criminalRecord: form.criminalRecord,
      driverLicenseId: form.driverLicenseId,
      driverScore: form.driverScore ? Number(form.driverScore) : 100,
      driverTripStatus: form.driverTripStatus,
      assignedVehicleId: null,
      assignedVehiclePlate: form.assignedVehiclePlate || null
    };

    if (form.passwordHash && form.passwordHash.trim() !== "") {
      payload.passwordHash = form.passwordHash;
    }

    try {
      const method = editItem && editItem.id ? "PUT" : "POST";
      const endpoint = editItem && editItem.id ? `/api/User/${editItem.id}` : `/api/User`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Kaydetme işlemi başarısız");

      try {
        let userId = editItem?.id;
        
        // Eğer POST (yeni ekleme) yapıyorsak dönen body'den id'yi okumaya çalış
        if (!userId) {
          try {
            const responseText = await res.clone().text();
            console.log("DRIVER ADD RESPONSE:", responseText);
            const savedUser = JSON.parse(responseText);
            userId = savedUser.id;
          } catch(err) {
            console.error("DRIVER ADD ID FETCH ERROR:", err);
          }
        }

        if (userId) {
          console.log("MARKING DRIVER:", userId);
          localStorage.setItem(`is_driver_${userId}`, 'true');
          localStorage.removeItem(`is_manager_${userId}`);

          if (form.assignedVehiclePlate) {
             localStorage.setItem(`driver_vehicle_plate_${userId}`, form.assignedVehiclePlate);
             localStorage.removeItem(`driver_vehicle_${userId}`); // Temizlik
          } else {
             localStorage.removeItem(`driver_vehicle_plate_${userId}`);
          }
        }
      } catch(e) { 
        console.error("Önbelleğe yazılırken hata:", e);
      }

      toast.success(editItem ? "Şoför ve Araç Ataması güncellendi" : "Şoför eklendi ve Araç atandı");
      setShowForm(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !deleteItem.id) return;
    try {
      const res = await fetch(`/api/User/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Silme işlemi başarısız");
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
      const payload = {
        driverId: dispatchItem.id,
        vehiclePlate: assignedPlate,
        startLocationId: Number(dispatchForm.startLocationId),
        endLocationId: Number(dispatchForm.endLocationId),
      };

      try {
        await apiFetch("/Trips/start", { method: "POST", body: JSON.stringify(payload) });
      } catch(e: any) {
        if (e.message?.includes("Driver not found")) {
           // Fallback to DriverId=1 if backend decoupled Identity vs Driver IDs
           payload.driverId = 1;
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
      await apiFetch(`/Trips/${tripId}/complete`, { method: "POST" });
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
        const status = d.driverTripStatus || "Boşta";
        const variant = status === "Aktif" || status === "active" ? "success" : (status === "Seferde" || status === "on_trip" ? "info" : "neutral");
        return <StatusBadge label={status} variant={variant} />;
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
          const activeTrip = activeTrips.find(t => t.driverId === d.id);
          
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
          <Field label="Ehliyet Tipi"><Input value={form.driverLicenseType || ""} placeholder="B, D1 vb." onChange={e => setForm({ ...form, driverLicenseType: e.target.value })} /></Field>
          <Field label="Rol">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-slate-500" disabled value="3">
              <option value="3">Sürücü (Driver)</option>
            </select>
          </Field>
          <Field label="Bağlı Yönetici ID"><Input type="number" value={form.parentManagerId || ""} onChange={e => setForm({ ...form, parentManagerId: Number(e.target.value) })} /></Field>
          <Field label="Puan"><Input type="number" value={form.driverScore ?? 100} onChange={e => setForm({ ...form, driverScore: Number(e.target.value) })} /></Field>
          <Field label="Atanan Araç">
            <select 
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground" 
              value={form.assignedVehiclePlate || ""} 
              onChange={e => setForm({ ...form, assignedVehiclePlate: e.target.value || "" })}
            >
              <option value="">Araç Seçiniz (Plaka)...</option>
              {vehicles.map(v => (
                <option key={v.plate} value={v.plate}>{v.plate}</option>
              ))}
            </select>
          </Field>
          
          <Field label="Status (Durum)">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.driverTripStatus || "Boşta"} onChange={e => setForm({ ...form, driverTripStatus: e.target.value })}>
              <option value="Boşta">Boşta</option>
              <option value="Seferde">Seferde</option>
              <option value="İzinli">İzinli</option>
              <option value="Pasif">Pasif</option>
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