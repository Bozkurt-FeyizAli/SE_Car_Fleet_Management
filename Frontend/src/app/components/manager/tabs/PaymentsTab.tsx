import React, { useState } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { payments, Payment, nextId } from "../../../data/mockData";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";

export function PaymentsTab() {
  const compPayments = () => payments.filter(p => p.company_id === currentCompany.id);
  const [data, setData] = useState(compPayments());
  const [editItem, setEditItem] = useState<Payment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Payment | null>(null);
  const [form, setForm] = useState({ payment_type: "incoming" as Payment["payment_type"], amount: "0", payment_method: "Havale", transaction_id: "", payment_date: "", description: "" });

  const openAdd = () => { setForm({ payment_type: "incoming", amount: "0", payment_method: "Havale", transaction_id: "", payment_date: new Date().toISOString().slice(0, 10), description: "" }); setEditItem(null); setShowForm(true); };
  const openEdit = (item: Payment) => { setForm({ payment_type: item.payment_type, amount: item.amount.toString(), payment_method: item.payment_method, transaction_id: item.transaction_id, payment_date: item.payment_date, description: item.description }); setEditItem(item); setShowForm(true); };

  const handleSave = () => {
    if (!form.amount || !form.description) { toast.error("Zorunlu alanlari doldurun"); return; }
    if (editItem) {
      const idx = payments.findIndex(p => p.id === editItem.id);
      if (idx >= 0) payments[idx] = { ...payments[idx], ...form, amount: Number(form.amount) };
    } else {
      payments.push({ id: nextId(), company_id: currentCompany.id, order_id: null, ...form, amount: Number(form.amount), currency: "TRY" });
    }
    setData(compPayments());
    setShowForm(false);
    toast.success(editItem ? "Odeme guncellendi" : "Odeme eklendi");
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    const idx = payments.findIndex(p => p.id === deleteItem.id);
    if (idx >= 0) payments.splice(idx, 1);
    setData(compPayments());
    setDeleteItem(null);
    toast.success("Odeme silindi");
  };

  const totalIncome = data.filter(p => p.payment_type === "incoming").reduce((s, p) => s + p.amount, 0);
  const totalExpense = data.filter(p => p.payment_type === "outgoing").reduce((s, p) => s + p.amount, 0);

  const columns: Column<Payment>[] = [
    { key: "date", header: "Tarih", render: (p) => new Date(p.payment_date).toLocaleDateString("tr-TR") },
    { key: "type", header: "Tip", render: (p) => <StatusBadge label={getStatusLabel(p.payment_type)} variant={p.payment_type === "incoming" ? "success" : "danger"} /> },
    { key: "amount", header: "Tutar", render: (p) => <span className={p.payment_type === "incoming" ? "text-emerald-600" : "text-red-600"}>₺{p.amount.toLocaleString("tr-TR")}</span> },
    { key: "method", header: "Yontem", render: (p) => p.payment_method },
    { key: "txn", header: "Islem No", render: (p) => p.transaction_id },
    { key: "desc", header: "Aciklama", render: (p) => <span className="max-w-[200px] truncate block">{p.description}</span> },
  ];

  return (
    <div>
      <h2 className="mb-2">Odemeler</h2>
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 text-sm">
        <span className="text-emerald-600">Gelir: ₺{totalIncome.toLocaleString("tr-TR")}</span>
        <span className="text-red-600">Gider: ₺{totalExpense.toLocaleString("tr-TR")}</span>
        <span className="text-foreground">Net: ₺{(totalIncome - totalExpense).toLocaleString("tr-TR")}</span>
      </div>
      <DataTable data={data} columns={columns} searchPlaceholder="Odeme ara..." searchKeys={["description", "transaction_id"]} onAdd={openAdd} addLabel="Odeme Ekle" onEdit={openEdit} onDelete={(p) => setDeleteItem(p)} />
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Odeme Duzenle" : "Yeni Odeme"} onSubmit={handleSave}>
        <Field label="Tip">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value as Payment["payment_type"] })}>
            <option value="incoming">Gelir</option><option value="outgoing">Gider</option>
          </select>
        </Field>
        <Field label="Tutar (TL) *"><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Odeme Yontemi">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
            <option value="Havale">Havale</option><option value="Kredi Karti">Kredi Karti</option><option value="Nakit">Nakit</option>
          </select>
        </Field>
        <Field label="Islem No"><Input value={form.transaction_id} onChange={e => setForm({ ...form, transaction_id: e.target.value })} /></Field>
        <Field label="Tarih"><Input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} /></Field>
        <Field label="Aciklama *"><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Odeme Sil" message="Bu odeme kaydini silmek istediginize emin misiniz?" />
    </div>
  );
}