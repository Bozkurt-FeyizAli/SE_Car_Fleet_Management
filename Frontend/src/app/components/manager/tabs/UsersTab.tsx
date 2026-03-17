import React, { useState } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { users, User, nextId, getDepartmentName } from "../../../data/mockData";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";

export function UsersTab() {
  const companyUsers = () => users.filter(u => u.company_id === currentCompany.id && u.role !== "driver");
  const [data, setData] = useState(companyUsers());
  const [editItem, setEditItem] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<User | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", role: "department_admin" as User["role"], status: "active" as User["status"], phone: "" });

  const openAdd = () => { setForm({ full_name: "", email: "", role: "department_admin", status: "active", phone: "" }); setEditItem(null); setShowForm(true); };
  const openEdit = (item: User) => { setForm({ full_name: item.full_name, email: item.email, role: item.role, status: item.status, phone: item.phone ?? "" }); setEditItem(item); setShowForm(true); };

  const handleSave = () => {
    if (!form.full_name || !form.email) { toast.error("Zorunlu alanlari doldurun"); return; }
    if (editItem) {
      const idx = users.findIndex(u => u.id === editItem.id);
      if (idx >= 0) users[idx] = { ...users[idx], ...form };
    } else {
      users.push({ id: nextId(), full_name: form.full_name, email: form.email, password_hash: "xxx", role: form.role, company_id: currentCompany.id, department_id: null, status: form.status, phone: form.phone, created_at: new Date().toISOString() });
    }
    setData(companyUsers());
    setShowForm(false);
    toast.success(editItem ? "Yonetici guncellendi" : "Yonetici eklendi");
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    const idx = users.findIndex(u => u.id === deleteItem.id);
    if (idx >= 0) users.splice(idx, 1);
    setData(companyUsers());
    setDeleteItem(null);
    toast.success("Yonetici silindi");
  };

  const columns: Column<User>[] = [
    { key: "name", header: "Ad Soyad", render: (u) => u.full_name },
    { key: "email", header: "E-posta", render: (u) => <span className="text-blue-600">{u.email}</span> },
    { key: "role", header: "Rol", render: (u) => <StatusBadge label={getStatusLabel(u.role)} variant="info" /> },
    { key: "dept", header: "Departman", render: (u) => getDepartmentName(u.department_id) },
    { key: "status", header: "Durum", render: (u) => <StatusBadge label={getStatusLabel(u.status)} variant={getStatusVariant(u.status)} /> },
  ];

  return (
    <div>
      <h2 className="mb-1">Yoneticiler</h2>
      <p className="text-sm text-muted-foreground mb-4">Sirketinizdeki yoneticiler</p>
      <DataTable data={data} columns={columns} searchPlaceholder="Yonetici ara..." searchKeys={["full_name", "email"]} onAdd={openAdd} addLabel="Yonetici Ekle" onEdit={openEdit} onDelete={(u) => setDeleteItem(u)} />
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Yonetici Duzenle" : "Yeni Yonetici"} onSubmit={handleSave}>
        <Field label="Ad Soyad *"><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="E-posta *"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Telefon"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Rol">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as User["role"] })}>
            <option value="company_admin">Sirket Yoneticisi</option>
            <option value="department_admin">Departman Yoneticisi</option>
          </select>
        </Field>
        <Field label="Durum">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as User["status"] })}>
            <option value="active">Aktif</option><option value="inactive">Pasif</option>
          </select>
        </Field>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Yonetici Sil" message={`"${deleteItem?.full_name}" yoneticisini silmek istediginize emin misiniz?`} />
    </div>
  );
}
