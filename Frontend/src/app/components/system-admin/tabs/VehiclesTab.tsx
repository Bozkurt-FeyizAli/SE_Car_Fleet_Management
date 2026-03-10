import React, { useState } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { vehicles, companies, Vehicle, nextId, getCompanyName, getDriverFullName } from "../../../data/mockData";
import { toast } from "sonner";

export function VehiclesTab() {
  const [data, setData] = useState([...vehicles]);
  const [editItem, setEditItem] = useState<Vehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({ plate_number: "", brand: "", model: "", year: "2024", vehicle_type: "truck" as Vehicle["vehicle_type"], capacity_kg: "25000", status: "available" as Vehicle["status"], insurance_expiry: "", inspection_expiry: "", casco_expiry: "", next_maint_km: "100000", base_price: "3000", company_id: "", document_number: "" });

  const openAdd = () => {
    setForm({ plate_number: "", brand: "", model: "", year: "2024", vehicle_type: "truck", capacity_kg: "25000", status: "available", insurance_expiry: "", inspection_expiry: "", casco_expiry: "", next_maint_km: "100000", base_price: "3000", company_id: "", document_number: "" });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: Vehicle) => {
    setForm({ plate_number: item.plate_number, brand: item.brand, model: item.model, year: item.year.toString(), vehicle_type: item.vehicle_type, capacity_kg: item.capacity_kg.toString(), status: item.status, insurance_expiry: item.insurance_expiry, inspection_expiry: item.inspection_expiry, casco_expiry: item.casco_expiry, next_maint_km: item.next_maint_km.toString(), base_price: item.base_price.toString(), company_id: item.company_id.toString(), document_number: item.document_number });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.plate_number || !form.brand || !form.model) { toast.error("Zorunlu alanlari doldurun"); return; }
    if (editItem) {
      const updated = data.map(v => v.id === editItem.id ? { ...v, ...form, year: Number(form.year), capacity_kg: Number(form.capacity_kg), next_maint_km: Number(form.next_maint_km), base_price: Number(form.base_price), company_id: Number(form.company_id), updated_at: new Date().toISOString() } : v);
      setData(updated);
      vehicles.splice(0, vehicles.length, ...updated);
      toast.success("Arac guncellendi");
    } else {
      const newItem: Vehicle = { id: nextId(), ...form, year: Number(form.year), capacity_kg: Number(form.capacity_kg), next_maint_km: Number(form.next_maint_km), base_price: Number(form.base_price), company_id: Number(form.company_id) || 1, gps_data: null, current_driver_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const updated = [...data, newItem];
      setData(updated);
      vehicles.splice(0, vehicles.length, ...updated);
      toast.success("Arac eklendi");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    const updated = data.filter(v => v.id !== deleteItem.id);
    setData(updated);
    vehicles.splice(0, vehicles.length, ...updated);
    setDeleteItem(null);
    toast.success("Arac silindi");
  };

  const columns: Column<Vehicle>[] = [
    { key: "plate", header: "Plaka", render: (v) => <span className="text-foreground">{v.plate_number}</span> },
    { key: "brand", header: "Marka / Model", render: (v) => `${v.brand} ${v.model}` },
    { key: "year", header: "Yil", render: (v) => v.year },
    { key: "type", header: "Tip", render: (v) => v.vehicle_type },
    { key: "doc", header: "Belge No", render: (v) => v.document_number },
    { key: "kasko", header: "Kasko Bitis", render: (v) => new Date(v.casco_expiry).toLocaleDateString("tr-TR") },
    { key: "insurance", header: "Sigorta Bitis", render: (v) => new Date(v.insurance_expiry).toLocaleDateString("tr-TR") },
    { key: "status", header: "Durum", render: (v) => <StatusBadge label={getStatusLabel(v.status)} variant={getStatusVariant(v.status)} /> },
    { key: "driver", header: "Sofor", render: (v) => getDriverFullName(v.current_driver_id) },
    { key: "company", header: "Sirket", render: (v) => getCompanyName(v.company_id) },
  ];

  return (
    <div>
      <h2 className="mb-4">Araclar</h2>
      <DataTable data={data} columns={columns} searchPlaceholder="Arac ara..." searchKeys={["plate_number", "brand", "model"]} onAdd={openAdd} addLabel="Arac Ekle" onEdit={openEdit} onDelete={(v) => setDeleteItem(v)} />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Arac Duzenle" : "Yeni Arac"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Plaka *"><Input value={form.plate_number} onChange={e => setForm({ ...form, plate_number: e.target.value })} /></Field>
          <Field label="Belge No"><Input value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} /></Field>
          <Field label="Marka *"><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></Field>
          <Field label="Model *"><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></Field>
          <Field label="Yil"><Input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></Field>
          <Field label="Arac Tipi">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value as Vehicle["vehicle_type"] })}>
              <option value="truck">Kamyon</option><option value="lorry">TIR</option><option value="van">Van</option><option value="car">Otomobil</option><option value="sedan">Sedan</option><option value="light_commercial">Hafif Ticari</option>
            </select>
          </Field>
          <Field label="Kapasite (kg)"><Input type="number" value={form.capacity_kg} onChange={e => setForm({ ...form, capacity_kg: e.target.value })} /></Field>
          <Field label="Taban Fiyat (TL)"><Input type="number" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} /></Field>
          <Field label="Sigorta Bitis"><Input type="date" value={form.insurance_expiry} onChange={e => setForm({ ...form, insurance_expiry: e.target.value })} /></Field>
          <Field label="Kasko Bitis"><Input type="date" value={form.casco_expiry} onChange={e => setForm({ ...form, casco_expiry: e.target.value })} /></Field>
          <Field label="Muayene Bitis"><Input type="date" value={form.inspection_expiry} onChange={e => setForm({ ...form, inspection_expiry: e.target.value })} /></Field>
          <Field label="Sonraki Bakim KM"><Input type="number" value={form.next_maint_km} onChange={e => setForm({ ...form, next_maint_km: e.target.value })} /></Field>
          <Field label="Sirket">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })}>
              <option value="">Sec...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Durum">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Vehicle["status"] })}>
              <option value="available">Musait</option><option value="in_service">Gorevde</option><option value="out_of_service">Devre Disi</option><option value="rented">Kirada</option>
            </select>
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Arac Sil" message={`"${deleteItem?.plate_number}" plakali araci silmek istediginize emin misiniz?`} />
    </div>
  );
}