import React, { useState } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { orders, drivers, vehicles, Order, nextId, getDriverFullName, getVehiclePlate } from "../../../data/mockData";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";

export function OrdersTab() {
  const compOrders = () => orders.filter(o => o.company_id === currentCompany.id);
  const [data, setData] = useState(compOrders());
  const [editItem, setEditItem] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Order | null>(null);
  const [form, setForm] = useState({ customer_name: "", order_number: "", pickup_address: "", delivery_address: "", scheduled_time: "", price: "0", driver_id: "", vehicle_id: "", status: "pending" as Order["status"], payment_status: "unpaid" as Order["payment_status"], notes: "" });

  const openAdd = () => { setForm({ customer_name: "", order_number: `ORD-${Date.now()}`, pickup_address: "", delivery_address: "", scheduled_time: "", price: "0", driver_id: "", vehicle_id: "", status: "pending", payment_status: "unpaid", notes: "" }); setEditItem(null); setShowForm(true); };
  const openEdit = (item: Order) => { setForm({ customer_name: item.customer_name, order_number: item.order_number, pickup_address: item.pickup_address, delivery_address: item.delivery_address, scheduled_time: item.scheduled_time.slice(0, 16), price: item.price.toString(), driver_id: item.driver_id?.toString() ?? "", vehicle_id: item.vehicle_id?.toString() ?? "", status: item.status, payment_status: item.payment_status, notes: item.notes }); setEditItem(item); setShowForm(true); };

  const handleSave = () => {
    if (!form.customer_name || !form.pickup_address || !form.delivery_address) { toast.error("Zorunlu alanlari doldurun"); return; }
    if (editItem) {
      const idx = orders.findIndex(o => o.id === editItem.id);
      if (idx >= 0) orders[idx] = { ...orders[idx], ...form, price: Number(form.price), driver_id: form.driver_id ? Number(form.driver_id) : null, vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null };
    } else {
      orders.push({ id: nextId(), company_id: currentCompany.id, ...form, price: Number(form.price), driver_id: form.driver_id ? Number(form.driver_id) : null, vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null, created_at: new Date().toISOString() });
    }
    setData(compOrders());
    setShowForm(false);
    toast.success(editItem ? "Siparis guncellendi" : "Siparis eklendi");
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    const idx = orders.findIndex(o => o.id === deleteItem.id);
    if (idx >= 0) orders.splice(idx, 1);
    setData(compOrders());
    setDeleteItem(null);
    toast.success("Siparis silindi");
  };

  const compDrivers = drivers.filter(d => d.company_id === currentCompany.id);
  const compVehicles = vehicles.filter(v => v.company_id === currentCompany.id);

  const columns: Column<Order>[] = [
    { key: "num", header: "Siparis No", render: (o) => <span className="text-foreground">{o.order_number}</span> },
    { key: "cust", header: "Musteri", render: (o) => o.customer_name },
    { key: "pickup", header: "Alim", render: (o) => <span className="max-w-[120px] truncate block">{o.pickup_address}</span> },
    { key: "delivery", header: "Teslimat", render: (o) => <span className="max-w-[120px] truncate block">{o.delivery_address}</span> },
    { key: "price", header: "Ucret", render: (o) => `₺${o.price.toLocaleString("tr-TR")}` },
    { key: "driver", header: "Sofor", render: (o) => getDriverFullName(o.driver_id) },
    { key: "status", header: "Durum", render: (o) => <StatusBadge label={getStatusLabel(o.status)} variant={getStatusVariant(o.status)} /> },
    { key: "pay", header: "Odeme", render: (o) => <StatusBadge label={getStatusLabel(o.payment_status)} variant={getStatusVariant(o.payment_status)} /> },
  ];

  return (
    <div>
      <h2 className="mb-4">Siparisler</h2>
      <DataTable data={data} columns={columns} searchPlaceholder="Siparis ara..." searchKeys={["order_number", "customer_name"]} onAdd={openAdd} addLabel="Siparis Ekle" onEdit={openEdit} onDelete={(o) => setDeleteItem(o)} />
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Siparis Duzenle" : "Yeni Siparis"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Musteri Adi *"><Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></Field>
          <Field label="Siparis No"><Input value={form.order_number} onChange={e => setForm({ ...form, order_number: e.target.value })} /></Field>
          <Field label="Alim Adresi *"><Input value={form.pickup_address} onChange={e => setForm({ ...form, pickup_address: e.target.value })} /></Field>
          <Field label="Teslimat Adresi *"><Input value={form.delivery_address} onChange={e => setForm({ ...form, delivery_address: e.target.value })} /></Field>
          <Field label="Planlanan Zaman"><Input type="datetime-local" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} /></Field>
          <Field label="Ucret (TL)"><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Sofor">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })}>
              <option value="">Atanmadi</option>
              {compDrivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </Field>
          <Field label="Arac">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">Atanmadi</option>
              {compVehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
            </select>
          </Field>
          <Field label="Durum">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Order["status"] })}>
              <option value="pending">Beklemede</option><option value="assigned">Atandi</option><option value="picked_up">Alindi</option><option value="delivered">Teslim Edildi</option><option value="cancelled">Iptal</option>
            </select>
          </Field>
          <Field label="Odeme Durumu">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value as Order["payment_status"] })}>
              <option value="unpaid">Odenmedi</option><option value="paid">Odendi</option><option value="refunded">Iade</option>
            </select>
          </Field>
        </div>
        <Field label="Notlar"><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Siparis Sil" message={`"${deleteItem?.order_number}" siparisini silmek istediginize emin misiniz?`} />
    </div>
  );
}