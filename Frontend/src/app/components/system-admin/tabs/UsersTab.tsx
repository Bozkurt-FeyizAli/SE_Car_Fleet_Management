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
    setForm({ ...item, passwordHash: "" });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.email) {
      toast.error("Ad ve E-posta zorunludur");
      return;
    }

    const payload = {
      ...form,
      roleId: form.roleId ? Number(form.roleId) : null,
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
        if (u.roleId === 0) label = "Süper Admin";
        if (u.roleId === 1) label = "Sistem Yöneticisi";
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
          <Field label="Ad *"><Input value={form.firstName || ""} onChange={e => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Soyad"><Input value={form.lastName || ""} onChange={e => setForm({ ...form, lastName: e.target.value })} /></Field>
          <Field label="E-posta *"><Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Şifre"><Input type="password" placeholder="***" value={form.passwordHash || ""} onChange={e => setForm({ ...form, passwordHash: e.target.value })} /></Field>
          <Field label="Rol">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.roleId ?? ""} onChange={e => setForm({ ...form, roleId: Number(e.target.value) })}>
              <option value="0">Süper Admin</option>
              <option value="1">Sistem Yöneticisi</option>
              <option value="2">Şirket Yöneticisi</option>
              <option value="3">Şoför</option>
            </select>
          </Field>
          <Field label="Durum">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.driverTripStatus || "active"} onChange={e => setForm({ ...form, driverTripStatus: e.target.value })}>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </Field>
        </div>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Kullanıcı Sil" message={`"${deleteItem?.firstName}" kullanıcısını silmek istediğinize emin misiniz?`} />
    </div>
  );
}
