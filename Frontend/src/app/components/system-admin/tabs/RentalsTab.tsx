import React, { useState } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { interCompanyRentals, companies, vehicles, drivers, InterCompanyRental, nextId, getCompanyName, getVehiclePlate, getDriverFullName } from "../../../data/mockData";
import { toast } from "sonner";

export function RentalsTab() {
  const [data, setData] = useState([...interCompanyRentals]);
  const [editItem, setEditItem] = useState<InterCompanyRental | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<InterCompanyRental | null>(null);
  const [form, setForm] = useState({ owner_comp_id: "", renter_comp_id: "", vehicle_id: "", driver_id: "", dynamic_price: "3000", start_date: "", end_date: "", status: "active" as InterCompanyRental["status"] });

  const openAdd = () => {
    setForm({ owner_comp_id: "", renter_comp_id: "", vehicle_id: "", driver_id: "", dynamic_price: "3000", start_date: "", end_date: "", status: "active" });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: InterCompanyRental) => {
    setForm({ owner_comp_id: item.owner_comp_id.toString(), renter_comp_id: item.renter_comp_id.toString(), vehicle_id: item.vehicle_id.toString(), driver_id: item.driver_id?.toString() ?? "", dynamic_price: item.dynamic_price.toString(), start_date: item.start_date, end_date: item.end_date ?? "", status: item.status });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.owner_comp_id || !form.renter_comp_id || !form.vehicle_id) { toast.error("Zorunlu alanlari doldurun"); return; }
    if (editItem) {
      const updated = data.map(r => r.id === editItem.id ? { ...r, owner_comp_id: Number(form.owner_comp_id), renter_comp_id: Number(form.renter_comp_id), vehicle_id: Number(form.vehicle_id), driver_id: form.driver_id ? Number(form.driver_id) : null, dynamic_price: Number(form.dynamic_price), start_date: form.start_date, end_date: form.end_date || null, status: form.status } : r);
      setData(updated);
      interCompanyRentals.splice(0, interCompanyRentals.length, ...updated);
      toast.success("Kiralama guncellendi");
    } else {
      const newItem: InterCompanyRental = { id: nextId(), owner_comp_id: Number(form.owner_comp_id), renter_comp_id: Number(form.renter_comp_id), vehicle_id: Number(form.vehicle_id), driver_id: form.driver_id ? Number(form.driver_id) : null, dynamic_price: Number(form.dynamic_price), start_date: form.start_date, end_date: form.end_date || null, status: form.status };
      const updated = [...data, newItem];
      setData(updated);
      interCompanyRentals.splice(0, interCompanyRentals.length, ...updated);
      toast.success("Kiralama eklendi");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    const updated = data.filter(r => r.id !== deleteItem.id);
    setData(updated);
    interCompanyRentals.splice(0, interCompanyRentals.length, ...updated);
    setDeleteItem(null);
    toast.success("Kiralama silindi");
  };

  const columns: Column<InterCompanyRental>[] = [
    { key: "vehicle", header: "Arac", render: (r) => getVehiclePlate(r.vehicle_id) },
    { key: "owner", header: "Kiraya Veren", render: (r) => getCompanyName(r.owner_comp_id) },
    { key: "renter", header: "Kiralayan", render: (r) => getCompanyName(r.renter_comp_id) },
    { key: "driver", header: "Sofor", render: (r) => getDriverFullName(r.driver_id) },
    { key: "price", header: "Dinamik Fiyat", render: (r) => `₺${r.dynamic_price.toLocaleString("tr-TR")}` },
    { key: "start", header: "Baslangic", render: (r) => new Date(r.start_date).toLocaleDateString("tr-TR") },
    { key: "end", header: "Bitis", render: (r) => r.end_date ? new Date(r.end_date).toLocaleDateString("tr-TR") : "—" },
    { key: "status", header: "Durum", render: (r) => <StatusBadge label={getStatusLabel(r.status)} variant={getStatusVariant(r.status)} /> },
  ];

  return (
    <div>
      <h2 className="mb-4">Sirketler Arasi Kiralamalar</h2>
      <DataTable data={data} columns={columns} searchPlaceholder="Kiralama ara..." searchKeys={[]} onAdd={openAdd} addLabel="Kiralama Ekle" onEdit={openEdit} onDelete={(r) => setDeleteItem(r)} />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Kiralama Duzenle" : "Yeni Kiralama"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Kiraya Veren Sirket *">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.owner_comp_id} onChange={e => setForm({ ...form, owner_comp_id: e.target.value })}>
              <option value="">Sec...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Kiralayan Sirket *">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.renter_comp_id} onChange={e => setForm({ ...form, renter_comp_id: e.target.value })}>
              <option value="">Sec...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Arac *">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">Sec...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number} - {v.brand} {v.model}</option>)}
            </select>
          </Field>
          <Field label="Sofor">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })}>
              <option value="">Sec...</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </Field>
          <Field label="Dinamik Fiyat (TL)"><Input type="number" value={form.dynamic_price} onChange={e => setForm({ ...form, dynamic_price: e.target.value })} /></Field>
          <Field label="Durum">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as InterCompanyRental["status"] })}>
              <option value="active">Aktif</option><option value="completed">Tamamlandi</option><option value="cancelled">Iptal</option>
            </select>
          </Field>
          <Field label="Baslangic Tarihi"><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></Field>
          <Field label="Bitis Tarihi"><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></Field>
        </div>
      </FormDialog>

      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Kiralama Sil" message="Bu kiralama kaydini silmek istediginize emin misiniz?" />
    </div>
  );
}