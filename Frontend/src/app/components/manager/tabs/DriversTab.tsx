import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";
import { ApiVehicle } from "./VehiclesTab";

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
  // Aşağıdaki property'ler Sürücü (Driver) tablosuna ait olduğu için backend User endpointi kabul etmiyor, geçici olarak formda null tutuyoruz.
  driverLicenseId?: string | null;
  driverLicenseType?: string | null;
  driverScore?: number | null;
  driverTripStatus?: string | null;
  assignedVehiclePlate?: string | null;
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
    companyId: 1, // Will be overridden or passed
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
      // Yalnızca Şoförleri listele, hatalı admin hesabını gizle. Role sistemi User API'sinde farklı ilerliyorsa burası da uyarlanabilir.
      setData(list.filter(u => u.email !== "admin@fleet.com"));
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
    setForm(getInitialForm());
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

    // Backend sadece UserRequest özelliklerini beklediği için ekstra Sürücü özelliklerini API'ye YOLAMIYORUZ
    const payload: any = {
      parentManagerId: form.parentManagerId ? Number(form.parentManagerId) : null,
      companyId: 1, // Fallback
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      tcIdentityNumber: form.tcIdentityNumber,
      criminalRecord: form.criminalRecord
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

      if (form.driverLicenseId || form.assignedVehiclePlate) {
          toast.warning("Kullanıcı eklendi ancak Sürücü (Araç ve Ehliyet) bilgileri henüz backend 'Driver' endpointine bağlanmadı.");
      } else {
          toast.success(editItem ? "Şoför güncellendi" : "Şoför eklendi");
      }
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
    { key: "vehicle", header: "Araç", render: (d: ApiUser) => d.assignedVehiclePlate || "—" },
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