import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";
import { ApiVehicle } from "../../manager/tabs/VehiclesTab";

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
  roleId: number | null;
  parentUserId: number | null;
  companyId?: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  passwordHash: string | null;
  phoneNumber?: string | null;
  phone?: string | null;
  tcIdentityNumber: string | null;
  criminalRecord: string | null;
  driverLicenseId: string | null;
  driverScore: number | null;
  driverTripStatus: string | null;
  assignedVehicleId?: number | null;
  assignedVehiclePlate?: string | null;
}

interface ApiDriverRecord {
  id: number;
  userId: number;
  vehiclePlate?: string | null;
  licenseNumber: string;
  points: number;
  status: string;
}

const normalizeStatus = (status: string | null | undefined): string => {
  const map: Record<string, string> = { "Boşta": "Idle", "Seferde": "InTrip", "İzinli": "OnLeave", "Pasif": "Inactive", "active": "Idle", "on_trip": "InTrip" };
  if (!status) return "Idle";
  return map[status] || status;
};

export function DriversTab() {
  const [data, setData] = useState<ApiUser[]>([]);
  const [editItem, setEditItem] = useState<ApiUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);

  const getInitialForm = (): ApiUser => ({
    roleId: null,
    parentUserId: null,
    firstName: "",
    lastName: "",
    email: "",
    passwordHash: "",
    phone: "",
    tcIdentityNumber: "",
    criminalRecord: "",
    driverLicenseId: "",
    driverScore: 80,
    driverTripStatus: "active",
    assignedVehicleId: null,
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

      const driversOnly = usersList.filter((u: any) => {
        const rid = u.roleId !== undefined && u.roleId !== null ? u.roleId : u.role;
        return rid === 2; // Sürücü
      }).map(u => ({
        ...u,
        driverId: driversByUserId.get(u.id)?.id,
        driverLicenseId: driversByUserId.get(u.id)?.licenseNumber || u.driverLicenseId,
        driverScore: driversByUserId.get(u.id)?.points ?? u.driverScore,
        assignedVehiclePlate: driversByUserId.get(u.id)?.vehiclePlate || u.assignedVehiclePlate,
        driverTripStatus: normalizeStatus(driversByUserId.get(u.id)?.status || u.driverTripStatus)
      }));
      
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
      if (res.ok) {
        const list: ApiVehicle[] = await res.json();
        setVehicles(list);
      }
    } catch (e) {
      console.error("Araçlar yüklenemedi", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchVehicles();
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
    setForm({ ...item, passwordHash: "" }); // Şifreyi güvenlik gereği boş gösteriyoruz
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

    if (!form.companyId) {
      toast.error("Şirket ID zorunludur.");
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

    try {
      // 1) USER CREATE / UPDATE (Temel Kullanıcı Bilgileri)
      const userPayload = {
        parentManagerId: form.parentUserId ? Number(form.parentUserId) : null,
        companyId: Number(form.companyId),
        role: 2, // Sürücü (Driver)
        roleId: 2,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber || form.phone,
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
          const created = await createRes.json();
          newId = created.id || created.userId;
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

      // 2) Sürücü (Driver) Profili Ekle/Güncelle
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
      
      // Clean up local storage assignments to free the vehicle
      localStorage.removeItem(`is_driver_${deleteItem.id}`);
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

  const columns: Column<ApiUser>[] = [
    { key: "name", header: "Ad Soyad", render: (d) => `${d.firstName || ""} ${d.lastName || ""}` },
    { key: "license", header: "Ehliyet No", render: (d) => d.driverLicenseId || "—" },
    { key: "score", header: "Puan", render: (d) => {
        const score = d.driverScore ?? 0;
        return <span className={score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600"}>{score}</span>;
      } 
    },
    { key: "vehicle", header: "Araç", render: (d) => {
        const localVehicleIdStr = localStorage.getItem(`driver_vehicle_${d.id}`);
        const vId = d.assignedVehicleId || (localVehicleIdStr ? Number(localVehicleIdStr) : null);
        if (!vId) return "—";
        const v = vehicles.find(x => x.id === vId);
        return v ? v.plate : vId;
      } 
    },
    { key: "status", header: "Durum", render: (d) => {
        const status = d.driverTripStatus || "inactive";
        const variant = status === "active" ? "success" : status === "on_trip" ? "info" : "neutral";
        const label = status === "active" ? "Aktif" : status === "on_trip" ? "Seferde" : "Pasif";
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
      />
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Şoför Düzenle" : "Yeni Şoför"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Ad *"><Input value={form.firstName || ""} onChange={e => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Soyad *"><Input value={form.lastName || ""} onChange={e => setForm({ ...form, lastName: e.target.value })} /></Field>
          <Field label="E-posta"><Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Şifre (Değiştirmek için yazın)"><Input type="password" placeholder="***" value={form.passwordHash || ""} onChange={e => setForm({ ...form, passwordHash: e.target.value })} /></Field>
          <Field label="Telefon"><Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="TC Kimlik No"><Input value={form.tcIdentityNumber || ""} onChange={e => setForm({ ...form, tcIdentityNumber: e.target.value })} /></Field>
          <Field label="Sicil Kaydı (Criminal Record)"><Input value={form.criminalRecord || ""} onChange={e => setForm({ ...form, criminalRecord: e.target.value })} /></Field>
          <Field label="Ehliyet No *"><Input value={form.driverLicenseId || ""} onChange={e => setForm({ ...form, driverLicenseId: e.target.value })} /></Field>
          <Field label="Rol">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-slate-500" disabled value="2">
              <option value="2">Şoför (Driver)</option>
            </select>
          </Field>
          <Field label="Şirket ID *"><Input type="number" value={form.companyId || ""} onChange={e => setForm({ ...form, companyId: Number(e.target.value) })} /></Field>
          <Field label="Bağlı Yönetici ID"><Input type="number" value={form.parentUserId || ""} onChange={e => setForm({ ...form, parentUserId: Number(e.target.value) })} /></Field>
          <Field label="Sürücü Puanı"><Input type="number" value={form.driverScore || 0} onChange={e => setForm({ ...form, driverScore: Number(e.target.value) })} /></Field>
          <Field label="Araç Plakası">
            <select
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground"
              value={form.assignedVehiclePlate || ""}
              onChange={e => setForm({ ...form, assignedVehiclePlate: e.target.value })}
            >
              <option value="">Atanmadı</option>
              {vehicles.map(v => (
                <option key={v.plate} value={v.plate}>{v.plate}</option>
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
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Şoför Sil" message={`"${deleteItem?.firstName} ${deleteItem?.lastName}" kullanıcısını silmek istediğinize emin misiniz?`} />
    </div>
  );
}