import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";
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

  useEffect(() => {
    fetchUsers();
    fetchVehicles();
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
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Şoför Sil" message={`"${deleteItem?.firstName} ${deleteItem?.lastName}" kullanıcısını silmek istediğinize emin misiniz?`} />
    </div>
  );
}