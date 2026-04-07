import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";

export interface Company {
  id: number;
  companyName: string;
  taxNumber: string;
}

export function CompaniesTab() {
  const [data, setData] = useState<Company[]>([]);
  const [editItem, setEditItem] = useState<Company | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({ 
    companyName: "", taxNumber: ""
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/companies");
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
    setForm({ companyName: "", taxNumber: "" });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: Company) => {
    setForm({ 
      companyName: item.companyName, taxNumber: item.taxNumber
    });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.companyName || !form.taxNumber) { 
      toast.error("Lütfen zorunlu alanları doldurun."); 
      return; 
    }
    
    try {
      if (editItem) {
        const res = await fetch(`/api/v1/companies/${editItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (!res.ok) throw new Error("Update failed");
        toast.success("Şirket güncellendi");
      } else {
        const res = await fetch(`/api/v1/companies`, {
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
      const res = await fetch(`/api/v1/companies/${deleteItem.id}`, { method: "DELETE" });
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
    { key: "id", header: "ID", render: (c) => c.id },
    { key: "companyName", header: "Şirket Adı", render: (c) => <span className="text-foreground font-medium">{c.companyName || "İsimsiz"}</span> },
    { key: "taxNumber", header: "Vergi No", render: (c) => <span className="text-blue-600">{c.taxNumber}</span> },
  ];

  return (
    <div>
      <h2 className="mb-4">Şirketler {isLoading && <span className="text-sm text-muted-foreground">(Yükleniyor...)</span>}</h2>
      <DataTable
        data={data} columns={columns}
        searchPlaceholder="Şirket ara..." searchKeys={["companyName", "taxNumber"]}
        onAdd={openAdd} addLabel="Şirket Ekle"
        onEdit={openEdit} onDelete={(c) => setDeleteItem(c)}
      />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Şirket Düzenle" : "Yeni Şirket Ekle"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Şirket Adı *"><Input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></Field>
          <Field label="Vergi Numarası *"><Input value={form.taxNumber} onChange={e => setForm({ ...form, taxNumber: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-muted-foreground mt-4 col-span-2">
          Bilgi: Şirket yönetici atamaları (Email ve Şifre işlemleri) sağ taraftaki "Kullanıcılar" veya "Şoförler" (Kullanıcı Atama) menülerinden yapılmalıdır. Şirket veritabanı sadece kurumsal kimlik içindir.
        </p>
      </FormDialog>

      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Şirket Sil" message={`"${deleteItem?.companyName}" adlı şirketi silmek istediğinize emin misiniz? Bütün verileri kaybolacaktır.`} />
    </div>
  );
}

export default CompaniesTab;
