import React, { useState } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { companyDocuments, CompanyDocument, nextId } from "../../../data/mockData";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";

export function DocumentsTab() {
  const compDocs = () => companyDocuments.filter(d => d.company_id === currentCompany.id);
  const [data, setData] = useState(compDocs());
  const [editItem, setEditItem] = useState<CompanyDocument | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<CompanyDocument | null>(null);
  const [form, setForm] = useState({ document_type: "", file_path: "", expiry_date: "", notes: "" });

  const openAdd = () => { setForm({ document_type: "", file_path: "", expiry_date: "", notes: "" }); setEditItem(null); setShowForm(true); };
  const openEdit = (item: CompanyDocument) => { setForm({ document_type: item.document_type, file_path: item.file_path, expiry_date: item.expiry_date ?? "", notes: item.notes }); setEditItem(item); setShowForm(true); };

  const handleSave = () => {
    if (!form.document_type) { toast.error("Belge tipini girin"); return; }
    if (editItem) {
      const idx = companyDocuments.findIndex(d => d.id === editItem.id);
      if (idx >= 0) companyDocuments[idx] = { ...companyDocuments[idx], ...form, expiry_date: form.expiry_date || null };
    } else {
      companyDocuments.push({ id: nextId(), company_id: currentCompany.id, ...form, expiry_date: form.expiry_date || null, upload_date: new Date().toISOString(), is_verified: false });
    }
    setData(compDocs());
    setShowForm(false);
    toast.success(editItem ? "Belge guncellendi" : "Belge eklendi");
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    const idx = companyDocuments.findIndex(d => d.id === deleteItem.id);
    if (idx >= 0) companyDocuments.splice(idx, 1);
    setData(compDocs());
    setDeleteItem(null);
    toast.success("Belge silindi");
  };

  const columns: Column<CompanyDocument>[] = [
    { key: "type", header: "Belge Tipi", render: (d) => d.document_type },
    { key: "upload", header: "Yukleme Tarihi", render: (d) => new Date(d.upload_date).toLocaleDateString("tr-TR") },
    { key: "expiry", header: "Gecerlilik", render: (d) => d.expiry_date ? new Date(d.expiry_date).toLocaleDateString("tr-TR") : "—" },
    { key: "verified", header: "Onay", render: (d) => <StatusBadge label={d.is_verified ? "Onayli" : "Beklemede"} variant={d.is_verified ? "success" : "warning"} /> },
    { key: "notes", header: "Not", render: (d) => d.notes || "—" },
  ];

  return (
    <div>
      <h2 className="mb-4">Sirket Belgeleri</h2>
      <DataTable data={data} columns={columns} searchPlaceholder="Belge ara..." searchKeys={["document_type", "notes"]} onAdd={openAdd} addLabel="Belge Ekle" onEdit={openEdit} onDelete={(d) => setDeleteItem(d)} />
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Belge Duzenle" : "Yeni Belge"} onSubmit={handleSave}>
        <Field label="Belge Tipi *">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.document_type} onChange={e => setForm({ ...form, document_type: e.target.value })}>
            <option value="">Sec...</option>
            <option value="Vergi Levhasi">Vergi Levhasi</option>
            <option value="Ticaret Sicil Gazetesi">Ticaret Sicil Gazetesi</option>
            <option value="Tasima Yetki Belgesi">Tasima Yetki Belgesi</option>
            <option value="Sigorta Policesi">Sigorta Policesi</option>
            <option value="Diger">Diger</option>
          </select>
        </Field>
        <Field label="Dosya Yolu"><Input value={form.file_path} onChange={e => setForm({ ...form, file_path: e.target.value })} placeholder="/docs/belge.pdf" /></Field>
        <Field label="Gecerlilik Bitis"><Input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></Field>
        <Field label="Not"><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Belge Sil" message="Bu belgeyi silmek istediginize emin misiniz?" />
    </div>
  );
}
