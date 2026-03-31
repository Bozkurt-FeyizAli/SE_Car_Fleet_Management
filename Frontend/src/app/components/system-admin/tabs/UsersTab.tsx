import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";
import { ApiUser } from "../../manager/tabs/DriversTab";

export function UsersTab() {
  const [data, setData] = useState<ApiUser[]>([]);
  const [editItem, setEditItem] = useState<ApiUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getInitialForm = (): ApiUser => ({
    roleId: null,
    parentManagerId: null,
    companyId: null,
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
    setForm({ ...item, passwordHash: "" });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.email) {
      toast.error("Ad ve E-posta zorunludur");
      return;
    }

    const payload: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      tcIdentityNumber: form.tcIdentityNumber,
      criminalRecord: form.criminalRecord,
      companyId: form.companyId ? Number(form.companyId) : 1,
      parentManagerId: form.parentManagerId ? Number(form.parentManagerId) : null,
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

      toast.success(editItem ? "Kullanıcı güncellendi" : "Kullanıcı eklendi");
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
      toast.success("Kullanıcı silindi");
      setDeleteItem(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const columns: Column<ApiUser>[] = [
    { key: "name", header: "Ad Soyad", render: (u) => `${u.firstName || ""} ${u.lastName || ""}` },
    { key: "email", header: "E-posta", render: (u) => <span className="text-blue-600">{u.email}</span> },
    { key: "role", header: "Rol", render: (u) => {
        let label = "Bilinmeyen";
        if (u.roleId === 0 || u.roleId === 1) label = "Süper Admin";
        if (u.roleId === 2) label = "Şirket Yöneticisi";
        if (u.roleId === 3) label = "Şoför";
        return <StatusBadge label={label} variant="info" />;
      } 
    },
    { key: "status", header: "Durum", render: (u) => {
        const status = u.driverTripStatus || "active";
        return <StatusBadge label={status === "active" ? "Aktif" : "Pasif"} variant={status === "active" ? "success" : "neutral"} />;
      }
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Kullanıcılar (Tümü)</h2>
      <DataTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Kullanıcı ara..." 
        searchKeys={["firstName", "lastName", "email"]} 
        onAdd={openAdd} 
        addLabel="Kullanıcı Ekle" 
        onEdit={openEdit} 
        onDelete={(u) => setDeleteItem(u)} 
      />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="İsim *"><Input value={form.firstName || ""} onChange={e => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Soyisim"><Input value={form.lastName || ""} onChange={e => setForm({ ...form, lastName: e.target.value })} /></Field>
          <Field label="E-posta *"><Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Şifre"><Input type="password" placeholder="***" value={form.passwordHash || ""} onChange={e => setForm({ ...form, passwordHash: e.target.value })} /></Field>
          <Field label="Telefon"><Input value={form.phoneNumber || ""} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></Field>
          <Field label="Tc (TC Kimlik No)"><Input value={form.tcIdentityNumber || ""} onChange={e => setForm({ ...form, tcIdentityNumber: e.target.value })} /></Field>
          <Field label="Sicil Kaydı"><Input value={form.criminalRecord || ""} onChange={e => setForm({ ...form, criminalRecord: e.target.value })} /></Field>
          <Field label="Ehliyet No"><Input value={form.driverLicenseId || ""} onChange={e => setForm({ ...form, driverLicenseId: e.target.value })} /></Field>
          <Field label="Ehliyet Tipi"><Input value={form.driverLicenseType || ""} placeholder="B, D1 vb." onChange={e => setForm({ ...form, driverLicenseType: e.target.value })} /></Field>
          <Field label="Rol">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.roleId ?? ""} onChange={e => setForm({ ...form, roleId: Number(e.target.value) })}>
              <option value="0">Süper Admin</option>
              <option value="1">Süper Admin (Sistem)</option>
              <option value="2">Şirket Yöneticisi</option>
              <option value="3">Sürücü</option>
            </select>
          </Field>
          <Field label="Şirket ID"><Input type="number" value={form.companyId || ""} onChange={e => setForm({ ...form, companyId: Number(e.target.value) })} /></Field>
          <Field label="Bağlı Yönetici ID"><Input type="number" value={form.parentManagerId || ""} onChange={e => setForm({ ...form, parentManagerId: Number(e.target.value) })} /></Field>
          <Field label="Puan"><Input type="number" value={form.driverScore ?? 100} onChange={e => setForm({ ...form, driverScore: Number(e.target.value) })} /></Field>
          <Field label="Atanan Araç Plakası"><Input value={form.assignedVehiclePlate || ""} onChange={e => setForm({ ...form, assignedVehiclePlate: e.target.value })} /></Field>
          <Field label="Durum">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.driverTripStatus || "Boşta"} onChange={e => setForm({ ...form, driverTripStatus: e.target.value })}>
              <option value="Boşta">Boşta</option>
              <option value="Seferde">Seferde</option>
              <option value="Pasif">Pasif</option>
            </select>
          </Field>
        </div>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Kullanıcı Sil" message={`"${deleteItem?.firstName}" kullanıcısını silmek istediğinize emin misiniz?`} />
    </div>
  );
}
