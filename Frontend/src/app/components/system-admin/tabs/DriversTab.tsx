import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";

export interface ApiUser {
  id?: number;
  roleId: number | null;
  parentUserId: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  passwordHash: string | null;
  phone: string | null;
  tcIdentityNumber: string | null;
  criminalRecord: string | null;
  driverLicenseId: string | null;
  driverScore: number | null;
  driverTripStatus: string | null;
  assignedVehicleId: number | null;
}

export function DriversTab() {
  const [data, setData] = useState<ApiUser[]>([]);
  const [editItem, setEditItem] = useState<ApiUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      const res = await fetch("/api/User");
      if (!res.ok) throw new Error("Kullanıcılar yüklenemedi");
      const list = await res.json();
      setData(list);
    } catch (e: any) {
      toast.error(e.message || "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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

    const payload = {
      ...form,
      roleId: 3,
      parentUserId: form.parentUserId ? Number(form.parentUserId) : null,
      driverScore: form.driverScore ? Number(form.driverScore) : null,
      assignedVehicleId: form.assignedVehicleId ? Number(form.assignedVehicleId) : null,
    };

    try {
      const method = editItem && editItem.id ? "PUT" : "POST";
      const endpoint = editItem && editItem.id ? `/api/User/${editItem.id}` : `/api/User`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Kaydetme işlemi başarısız");

      toast.success(editItem ? "Şoför/Kullanıcı güncellendi" : "Şoför/Kullanıcı eklendi");
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
    { key: "vehicle", header: "Araç ID", render: (d) => d.assignedVehicleId || "—" },
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
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-slate-500" disabled value="3">
              <option value="3">Şoför (Driver)</option>
            </select>
          </Field>
          <Field label="Bağlı Yönetici ID"><Input type="number" value={form.parentUserId || ""} onChange={e => setForm({ ...form, parentUserId: Number(e.target.value) })} /></Field>
          <Field label="Sürücü Puanı"><Input type="number" value={form.driverScore || 0} onChange={e => setForm({ ...form, driverScore: Number(e.target.value) })} /></Field>
          <Field label="Atanan Araç ID"><Input type="number" value={form.assignedVehicleId || ""} onChange={e => setForm({ ...form, assignedVehicleId: Number(e.target.value) })} /></Field>
          
          <Field label="Durum">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.driverTripStatus || "active"} onChange={e => setForm({ ...form, driverTripStatus: e.target.value })}>
              <option value="active">Aktif</option>
              <option value="on_trip">Seferde</option>
              <option value="off_duty">İzinli</option>
              <option value="inactive">Pasif</option>
            </select>
          </Field>
        </div>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Şoför Sil" message={`"${deleteItem?.firstName} ${deleteItem?.lastName}" kullanıcısını silmek istediğinize emin misiniz?`} />
    </div>
  );
}