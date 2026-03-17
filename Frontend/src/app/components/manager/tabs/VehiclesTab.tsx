import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";

// Fetch'den dönecek olan Swagger yapısına uygun interface
export interface ApiVehicle {
  id?: number;
  plateNumber: string;
  registrationNumber: string | null;
  brandModel: string | null;
  year: number;
  vehicleType: string | null;
  capacityKg: number;
  baseRentPrice: number;
  insuranceStartDate: string | null;
  insuranceEndDate: string | null;
  cascoStartDate: string | null;
  cascoEndDate: string | null;
  inspectionStartDate: string | null;
  inspectionEndDate: string | null;
  nextMaintenanceKm: number;
  isActive: boolean;
}

export function VehiclesTab() {
  const [data, setData] = useState<ApiVehicle[]>([]);
  const [editItem, setEditItem] = useState<ApiVehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form objemizin state'inin varsayılan hali
  const getInitialForm = (): ApiVehicle => ({
    plateNumber: "",
    brandModel: "",
    registrationNumber: "",
    year: new Date().getFullYear(),
    vehicleType: "Kamyon",
    capacityKg: 0,
    baseRentPrice: 0,
    isActive: true,
    insuranceStartDate: "",
    insuranceEndDate: "",
    cascoStartDate: "",
    cascoEndDate: "",
    inspectionStartDate: "",
    inspectionEndDate: "",
    nextMaintenanceKm: 0,
  });

  const [form, setForm] = useState<ApiVehicle>(getInitialForm());

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/Vehicle");
      if (!res.ok) throw new Error("Araçlar yüklenemedi");
      const list = await res.json();
      setData(list);
    } catch (e: any) {
      toast.error(e.message || "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAdd = () => {
    setForm(getInitialForm());
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: ApiVehicle) => {
    setForm({
      ...item,
      // Tarih formatlarını form inputlarına uygun hale getir (YYYY-MM-DD)
      insuranceStartDate: item.insuranceStartDate ? item.insuranceStartDate.split('T')[0] : "",
      insuranceEndDate: item.insuranceEndDate ? item.insuranceEndDate.split('T')[0] : "",
      cascoStartDate: item.cascoStartDate ? item.cascoStartDate.split('T')[0] : "",
      cascoEndDate: item.cascoEndDate ? item.cascoEndDate.split('T')[0] : "",
      inspectionStartDate: item.inspectionStartDate ? item.inspectionStartDate.split('T')[0] : "",
      inspectionEndDate: item.inspectionEndDate ? item.inspectionEndDate.split('T')[0] : "",
    });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.plateNumber || !form.brandModel) {
      toast.error("Plaka ve Marka/Model zorunludur");
      return;
    }

    // Tarih alanları boş ise null'a çevir, yoksa ISO formatında yolla.
    const payload = {
      ...form,
      year: Number(form.year),
      capacityKg: Number(form.capacityKg),
      baseRentPrice: Number(form.baseRentPrice),
      nextMaintenanceKm: Number(form.nextMaintenanceKm),
      insuranceStartDate: form.insuranceStartDate ? new Date(form.insuranceStartDate).toISOString() : null,
      insuranceEndDate: form.insuranceEndDate ? new Date(form.insuranceEndDate).toISOString() : null,
      cascoStartDate: form.cascoStartDate ? new Date(form.cascoStartDate).toISOString() : null,
      cascoEndDate: form.cascoEndDate ? new Date(form.cascoEndDate).toISOString() : null,
      inspectionStartDate: form.inspectionStartDate ? new Date(form.inspectionStartDate).toISOString() : null,
      inspectionEndDate: form.inspectionEndDate ? new Date(form.inspectionEndDate).toISOString() : null,
    };

    try {
      const method = editItem && editItem.id ? "PUT" : "POST";
      const endpoint = editItem && editItem.id ? `/api/Vehicle/${editItem.id}` : `/api/Vehicle`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Kaydetme işlemi başarısız");

      toast.success(editItem ? "Araç güncellendi" : "Araç eklendi");
      setShowForm(false);
      fetchVehicles();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !deleteItem.id) return;
    try {
      const res = await fetch(`/api/Vehicle/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Silme işlemi başarısız");
      toast.success("Araç silindi");
      setDeleteItem(null);
      fetchVehicles();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("tr-TR");
  };

  const columns: Column<ApiVehicle>[] = [
    { key: "plate", header: "Plaka", render: (v) => <span className="text-foreground">{v.plateNumber}</span> },
    { key: "brandModel", header: "Marka / Model", render: (v) => v.brandModel || "—" },
    { key: "year", header: "Yıl", render: (v) => v.year },
    { key: "doc", header: "Ruhsat No", render: (v) => v.registrationNumber || "—" },
    { key: "kasko", header: "Kasko Bitiş", render: (v) => formatDate(v.cascoEndDate) },
    { key: "insurance", header: "Sigorta Bitiş", render: (v) => formatDate(v.insuranceEndDate) },
    { key: "status", header: "Durum", render: (v) => <StatusBadge label={v.isActive ? "Aktif" : "Pasif"} variant={v.isActive ? "success" : "neutral"} /> },
  ];

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Şirket Araçları</h2>
      <DataTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Araç ara..." 
        searchKeys={["plateNumber", "brandModel"]} 
        onAdd={openAdd} 
        addLabel="Araç Ekle" 
        onEdit={openEdit} 
        onDelete={(v) => setDeleteItem(v)} 
      />
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Araç Düzenle" : "Yeni Araç"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Plaka *"><Input value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} /></Field>
          <Field label="Marka / Model *"><Input value={form.brandModel || ""} onChange={e => setForm({ ...form, brandModel: e.target.value })} /></Field>
          <Field label="Ruhsat No"><Input value={form.registrationNumber || ""} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} /></Field>
          <Field label="Yıl"><Input type="number" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} /></Field>
          
          <Field label="Tip">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.vehicleType || ""} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
              <option value="Kamyon">Kamyon</option>
              <option value="TIR">TIR</option>
              <option value="Van">Van</option>
              <option value="Otomobil">Otomobil</option>
            </select>
          </Field>
          <Field label="Kapasite (kg)"><Input type="number" value={form.capacityKg} onChange={e => setForm({ ...form, capacityKg: Number(e.target.value) })} /></Field>
          <Field label="Taban Fiyat (TL)"><Input type="number" value={form.baseRentPrice} onChange={e => setForm({ ...form, baseRentPrice: Number(e.target.value) })} /></Field>
          <Field label="Sonraki Bakım KM"><Input type="number" value={form.nextMaintenanceKm} onChange={e => setForm({ ...form, nextMaintenanceKm: Number(e.target.value) })} /></Field>
          
          <Field label="Durum (Aktif/Pasif)">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.isActive ? "true" : "false"} onChange={e => setForm({ ...form, isActive: e.target.value === "true" })}>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </Field>
          
          {/* Tarih Alanları */}
          <Field label="Sigorta Başlangıç"><Input type="date" value={form.insuranceStartDate || ""} onChange={e => setForm({ ...form, insuranceStartDate: e.target.value })} /></Field>
          <Field label="Sigorta Bitiş"><Input type="date" value={form.insuranceEndDate || ""} onChange={e => setForm({ ...form, insuranceEndDate: e.target.value })} /></Field>
          <Field label="Kasko Başlangıç"><Input type="date" value={form.cascoStartDate || ""} onChange={e => setForm({ ...form, cascoStartDate: e.target.value })} /></Field>
          <Field label="Kasko Bitiş"><Input type="date" value={form.cascoEndDate || ""} onChange={e => setForm({ ...form, cascoEndDate: e.target.value })} /></Field>
          <Field label="Muayene Başlangıç"><Input type="date" value={form.inspectionStartDate || ""} onChange={e => setForm({ ...form, inspectionStartDate: e.target.value })} /></Field>
          <Field label="Muayene Bitiş"><Input type="date" value={form.inspectionEndDate || ""} onChange={e => setForm({ ...form, inspectionEndDate: e.target.value })} /></Field>
        </div>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Araç Sil" message={`"${deleteItem?.plateNumber}" plakalı aracı silmek istediğinize emin misiniz?`} />
    </div>
  );
}