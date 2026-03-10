import React, { useState } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { companies, Company, nextId } from "../../../data/mockData";
import { toast } from "sonner";

export function CompaniesTab() {
  const [data, setData] = useState([...companies]);
  const [editItem, setEditItem] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Company | null>(null);

  const [form, setForm] = useState({ name: "", tax_number: "", email: "", address: "", phone: "", website: "", status: "active" as Company["status"] });

  const openAdd = () => {
    setForm({ name: "", tax_number: "", email: "", address: "", phone: "", website: "", status: "active" });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: Company) => {
    setForm({ name: item.name, tax_number: item.tax_number, email: item.email, address: item.address, phone: item.phone, website: item.website, status: item.status });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.tax_number || !form.email) { toast.error("Zorunlu alanlari doldurun"); return; }
    if (editItem) {
      const updated = data.map(c => c.id === editItem.id ? { ...c, ...form, updated_at: new Date().toISOString() } : c);
      setData(updated);
      companies.splice(0, companies.length, ...updated);
      toast.success("Sirket guncellendi");
    } else {
      const newItem: Company = { id: nextId(), ...form, logo_url: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const updated = [...data, newItem];
      setData(updated);
      companies.splice(0, companies.length, ...updated);
      toast.success("Sirket eklendi");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    const updated = data.filter(c => c.id !== deleteItem.id);
    setData(updated);
    companies.splice(0, companies.length, ...updated);
    setDeleteItem(null);
    toast.success("Sirket silindi");
  };

  const columns: Column<Company>[] = [
    { key: "name", header: "Sirket Adi", render: (c) => <span className="text-foreground">{c.name}</span> },
    { key: "tax", header: "Vergi No", render: (c) => c.tax_number },
    { key: "email", header: "E-posta", render: (c) => <span className="text-blue-600">{c.email}</span> },
    { key: "phone", header: "Telefon", render: (c) => c.phone },
    { key: "status", header: "Durum", render: (c) => <StatusBadge label={getStatusLabel(c.status)} variant={getStatusVariant(c.status)} /> },
    { key: "date", header: "Kayit Tarihi", render: (c) => new Date(c.created_at).toLocaleDateString("tr-TR") },
  ];

  return (
    <div>
      <h2 className="mb-4">Sirketler</h2>
      <DataTable
        data={data} columns={columns}
        searchPlaceholder="Sirket ara..." searchKeys={["name", "tax_number", "email"]}
        onAdd={openAdd} addLabel="Sirket Ekle"
        onEdit={openEdit} onDelete={(c) => setDeleteItem(c)}
      />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Sirket Duzenle" : "Yeni Sirket"} onSubmit={handleSave}>
        <Field label="Sirket Adi *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Vergi Numarasi *"><Input value={form.tax_number} onChange={e => setForm({ ...form, tax_number: e.target.value })} /></Field>
        <Field label="E-posta *"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Telefon"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Adres"><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="Website"><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></Field>
        <Field label="Durum">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Company["status"] })}>
            <option value="active">Aktif</option>
            <option value="suspended">Askida</option>
            <option value="passive">Pasif</option>
          </select>
        </Field>
      </FormDialog>

      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Sirket Sil" message={`"${deleteItem?.name}" sirketini silmek istediginize emin misiniz?`} />
    </div>
  );
}
