import React, { useState } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { users, companies, User, nextId, getCompanyName } from "../../../data/mockData";
import { toast } from "sonner";

export function UsersTab() {
  const [data, setData] = useState([...users]);
  const [editItem, setEditItem] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<User | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", role: "company_admin" as User["role"], company_id: "" as string, status: "active" as User["status"], phone: "" });

  const openAdd = () => {
    setForm({ full_name: "", email: "", role: "company_admin", company_id: "", status: "active", phone: "" });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: User) => {
    setForm({ full_name: item.full_name, email: item.email, role: item.role, company_id: item.company_id?.toString() ?? "", status: item.status, phone: item.phone ?? "" });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.full_name || !form.email) { toast.error("Zorunlu alanlari doldurun"); return; }
    if (editItem) {
      const updated = data.map(u => u.id === editItem.id ? { ...u, full_name: form.full_name, email: form.email, role: form.role, company_id: form.company_id ? Number(form.company_id) : null, status: form.status, phone: form.phone } : u);
      setData(updated);
      users.splice(0, users.length, ...updated);
      toast.success("Kullanici guncellendi");
    } else {
      const newItem: User = { id: nextId(), full_name: form.full_name, email: form.email, password_hash: "xxx", role: form.role, company_id: form.company_id ? Number(form.company_id) : null, department_id: null, status: form.status, phone: form.phone, created_at: new Date().toISOString() };
      const updated = [...data, newItem];
      setData(updated);
      users.splice(0, users.length, ...updated);
      toast.success("Kullanici eklendi");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    const updated = data.filter(u => u.id !== deleteItem.id);
    setData(updated);
    users.splice(0, users.length, ...updated);
    setDeleteItem(null);
    toast.success("Kullanici silindi");
  };

  const columns: Column<User>[] = [
    { key: "name", header: "Ad Soyad", render: (u) => u.full_name },
    { key: "email", header: "E-posta", render: (u) => <span className="text-blue-600">{u.email}</span> },
    { key: "role", header: "Rol", render: (u) => <StatusBadge label={getStatusLabel(u.role)} variant="info" /> },
    { key: "company", header: "Sirket", render: (u) => getCompanyName(u.company_id) },
    { key: "status", header: "Durum", render: (u) => <StatusBadge label={getStatusLabel(u.status)} variant={getStatusVariant(u.status)} /> },
  ];

  return (
    <div>
      <h2 className="mb-4">Kullanicilar</h2>
      <DataTable data={data} columns={columns} searchPlaceholder="Kullanici ara..." searchKeys={["full_name", "email"]} onAdd={openAdd} addLabel="Kullanici Ekle" onEdit={openEdit} onDelete={(u) => setDeleteItem(u)} />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Kullanici Duzenle" : "Yeni Kullanici"} onSubmit={handleSave}>
        <Field label="Ad Soyad *"><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="E-posta *"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Telefon"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Rol">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as User["role"] })}>
            <option value="system_admin">Sistem Yoneticisi</option>
            <option value="company_admin">Sirket Yoneticisi</option>
            <option value="department_admin">Departman Yoneticisi</option>
            <option value="driver">Sofor</option>
          </select>
        </Field>
        <Field label="Sirket">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })}>
            <option value="">— Yok (Sistem Yoneticisi) —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Durum">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as User["status"] })}>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
        </Field>
      </FormDialog>

      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Kullanici Sil" message={`"${deleteItem?.full_name}" kullanicisini silmek istediginize emin misiniz?`} />
    </div>
  );
}
