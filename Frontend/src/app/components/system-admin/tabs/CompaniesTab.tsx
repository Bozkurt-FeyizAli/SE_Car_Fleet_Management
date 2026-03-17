import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";

export interface Company {
  id: number;
  name: string;
  taxNumber: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  contactPerson: string;
  status: string;
  fleetSize: number;
  subscriptionPlan: string;
  createdAt: string;
}

export function CompaniesTab() {
  const [data, setData] = useState<Company[]>([]);
  const [editItem, setEditItem] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({ 
    name: "", taxNumber: "", email: "", address: "", phone: "", website: "", status: "active", contactPerson: "", fleetSize: 0, subscriptionPlan: "basic"
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/Company");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error("Şirketler listesi yüklenemedi.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setForm({ name: "", taxNumber: "", email: "", address: "", phone: "", website: "", status: "active", contactPerson: "", fleetSize: 0, subscriptionPlan: "basic" });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: Company) => {
    setForm({ 
      name: item.name, taxNumber: item.taxNumber, email: item.email, address: item.address, 
      phone: item.phone, website: item.website, status: item.status, contactPerson: item.contactPerson,
      fleetSize: item.fleetSize, subscriptionPlan: item.subscriptionPlan
    });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.taxNumber || !form.email) { 
      toast.error("Lütfen zorunlu alanları doldurun."); 
      return; 
    }
    
    try {
      if (editItem) {
        const res = await fetch(`/api/Company/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Şirket güncellendi");
      } else {
        const res = await fetch(`/api/Company`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error("Create failed");
        toast.success("Şirket eklendi");
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error("Kayıt sırasında bir hata oluştu.");
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      const res = await fetch(`/api/Company/${deleteItem.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Şirket kalıcı olarak silindi");
      setDeleteItem(null);
      fetchData();
    } catch (err) {
      toast.error("Silme işlemi başarısız.");
      console.error(err);
    }
  };

  const columns: Column<Company>[] = [
    { key: "name", header: "Şirket Adı", render: (c) => <span className="text-foreground">{c.name}</span> },
    { key: "tax", header: "Vergi No", render: (c) => c.taxNumber },
    { key: "email", header: "E-posta", render: (c) => <span className="text-blue-600">{c.email}</span> },
    { key: "person", header: "İletişim", render: (c) => c.contactPerson },
    { key: "status", header: "Durum", render: (c) => <StatusBadge label={getStatusLabel(c.status)} variant={getStatusVariant(c.status)} /> },
    { key: "date", header: "Kayıt Tarihi", render: (c) => new Date(c.createdAt).toLocaleDateString("tr-TR") },
  ];

  return (
    <div>
      <h2 className="mb-4">Şirketler {isLoading && <span className="text-sm text-muted-foreground">(Yükleniyor...)</span>}</h2>
      <DataTable
        data={data} columns={columns}
        searchPlaceholder="Şirket ara..." searchKeys={["name", "taxNumber", "email"]}
        onAdd={openAdd} addLabel="Şirket Ekle"
        onEdit={openEdit} onDelete={(c) => setDeleteItem(c)}
      />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Şirket Düzenle" : "Yeni Şirket Ekle"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Şirket Adı *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Vergi Numarası *"><Input value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} /></Field>
        <Field label="E-posta *"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Telefon"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Adres"><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="Website"><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></Field>
        
        <div className="col-span-1 sm:col-span-2 mt-4 mb-2">
          <h3 className="text-sm font-semibold text-muted-foreground border-b border-border pb-2">Yönetici / İletişim Bilgileri</h3>
        </div>
        <Field label="İletişim Kişisi (Ad Soyad)"><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></Field>

        <Field label="Durum">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="active">Aktif</option>
            <option value="suspended">Askıda</option>
            <option value="passive">Pasif</option>
          </select>
        </Field>
        </div>
      </FormDialog>

      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Şirket Sil" message={`"${deleteItem?.name}" adlı şirketi silmek istediğinize emin misiniz? Bütün verileri kaybolacaktır.`} />
    </div>
  );
}

export default CompaniesTab;
