import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";

// Fetch'den dönecek olan Swagger yapısına uygun interface
export interface ApiVehicleRegistration {
  registrationNumber: string;
  brandModel: string | null;
  year: number;
  type: string | null;
  capacity: number;
}

export interface ApiVehicle {
  id?: number;
  plate: string;
  registrationNumber: string | null;
  currentKm: number;
  baseRentPrice: number;
  insuranceEndDate: string | null;
  cascoEndDate: string | null;
  inspectionEndDate: string | null;
  nextMaintenanceKm: number;
  isActive: boolean;
  companyId?: number;
  damageRecordAmount?: number;
  status?: string;
  // UI fields merged from registration
  brandModel?: string | null;
  year?: number;
  vehicleType?: string | null;
  capacityKg?: number;
}

// --- GERÇEKÇİ RASTGELE VERİ ÜRETEÇLERİ ---
export const generatePlate = () => {
  const cities = ["01", "06", "07", "16", "34", "35", "41", "54", "61"];
  const letters = "ABCDEFGHJKLMNPRSTUVYZ";
  const city = cities[Math.floor(Math.random() * cities.length)];
  let mid = "";
  const letterCount = Math.floor(Math.random() * 2) + 2;
  for(let i=0; i<letterCount; i++) mid += letters[Math.floor(Math.random() * letters.length)];
  const end = Math.floor(10 + Math.random() * 899);
  return `${city} ${mid} ${end}`;
};

export const generateRegNo = () => {
  const letters = "ABCDEFGHIJKLMNOPRSTUVYZ";
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(100000 + Math.random() * 899999);
  return `${l1}${l2}${num}`;
};

export const generateBrandModel = () => {
  const models = ["Ford Transit", "Mercedes Sprinter", "Volkswagen Crafter", "Renault Master", "Iveco Daily", "Fiat Ducato", "Isuzu NPR", "Scania R450", "Volvo FH16"];
  return models[Math.floor(Math.random() * models.length)];
};

export const generateFutureDate = (monthsAhead = 6) => {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead + Math.floor(Math.random() * 12));
  return d.toISOString().split('T')[0];
};
// ------------------------------------------

export function VehiclesTab() {
  const [data, setData] = useState<ApiVehicle[]>([]);
  const [editItem, setEditItem] = useState<ApiVehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiVehicle | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form objemizin state'inin varsayılan hali
  const getInitialForm = (): ApiVehicle => ({
    plate: "",
    brandModel: "",
    registrationNumber: "",
    currentKm: 0,
    year: new Date().getFullYear(),
    vehicleType: "Kamyon",
    capacityKg: 0,
    baseRentPrice: 0,
    isActive: true,
    insuranceEndDate: "",
    cascoEndDate: "",
    inspectionEndDate: "",
    nextMaintenanceKm: 0,
    companyId: 1,
    damageRecordAmount: 0,
  });

  const [form, setForm] = useState<ApiVehicle>(getInitialForm());

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const [vRes, rRes, cRes] = await Promise.all([
        fetch("/api/v1/vehicles"),
        fetch("/api/v1/vehicle-registrations"),
        fetch("/api/v1/companies").catch(() => null)
      ]);
      
      if (!vRes.ok || !rRes.ok) throw new Error("Veriler yüklenemedi");
      
      const vehicles: ApiVehicle[] = await vRes.json();
      const regs: ApiVehicleRegistration[] = await rRes.json();
      
      if (cRes && cRes.ok) {
        try {
          const cList = await cRes.json();
          setCompanies(Array.isArray(cList) ? cList : []);
        } catch(e) {}
      }

      // Aktif kiralamaları çek (iade edilmemiş)
      let rentedPlates = new Set<string>();
      try {
        const rentals = await apiFetch("/v1/rentals/my-rentals");
        const rentalList = Array.isArray(rentals) ? rentals : (rentals?.data || []);
        rentedPlates = new Set(
          rentalList.filter((r: any) => !r.returnDate).map((r: any) => r.vehiclePlate)
        );
      } catch (err) {}

      // Aktif seferleri çek — tüm şirketler için
      let onTripPlates = new Set<string>();
      try {
        // Her şirketin aktif seferlerini topla
        const companyIds = [...new Set(vehicles.map(v => v.companyId).filter(Boolean))];
        const tripPromises = companyIds.map(cId => apiFetch(`/Trips/active/${cId}`).catch(() => []));
        const tripResults = await Promise.all(tripPromises);
        const allTrips = tripResults.flat();
        onTripPlates = new Set(
          allTrips.map((t: any) => t.vehiclePlate).filter(Boolean)
        );
      } catch (err) {}
      
      const merged = vehicles.map(v => {
        const r = regs.find(reg => reg.registrationNumber === v.registrationNumber);
        return {
          ...v,
          brandModel: r?.brandModel,
          year: r?.year,
          vehicleType: r?.type,
          capacityKg: r?.capacity,
          isRented: rentedPlates.has(v.plate),
          isOnTrip: onTripPlates.has(v.plate)
        };
      });
      
      setData(merged);
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
    setForm({
      ...getInitialForm(),
      plate: generatePlate(),
      registrationNumber: generateRegNo(),
      brandModel: generateBrandModel(),
      year: 2018 + Math.floor(Math.random() * 7),
      currentKm: Math.floor(Math.random() * 150000),
      baseRentPrice: 1500 + Math.floor(Math.random() * 2500),
      insuranceEndDate: generateFutureDate(6),
      cascoEndDate: generateFutureDate(8),
      inspectionEndDate: generateFutureDate(10),
    });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: ApiVehicle) => {
    const remainingKm = item.nextMaintenanceKm && item.currentKm
      ? Math.max(0, item.nextMaintenanceKm - item.currentKm)
      : (item.nextMaintenanceKm || 0);
    setForm({
      ...item,
      nextMaintenanceKm: remainingKm,
      // Tarih formatlarını form inputlarına uygun hale getir (YYYY-MM-DD)
      insuranceEndDate: item.insuranceEndDate ? item.insuranceEndDate.split('T')[0] : "",
      cascoEndDate: item.cascoEndDate ? item.cascoEndDate.split('T')[0] : "",
      inspectionEndDate: item.inspectionEndDate ? item.inspectionEndDate.split('T')[0] : "",
    });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.plate || !form.brandModel) {
      toast.error("Plaka ve Marka/Model zorunludur");
      return;
    }

    // Tarih alanları boş ise null'a çevir, yoksa ISO formatında yolla.
    const regPayload: ApiVehicleRegistration = {
      registrationNumber: form.registrationNumber || "",
      brandModel: form.brandModel || "Bilinmiyor",
      year: Number(form.year || new Date().getFullYear()),
      type: form.vehicleType || "Kamyon",
      capacity: Number(form.capacityKg || 0)
    };

    const vehiclePayload = {
      plate: editItem ? editItem.plate : form.plate,
      registrationNumber: editItem ? (editItem.registrationNumber || form.registrationNumber) : form.registrationNumber,
      currentKm: Number(form.currentKm || 0),
      baseRentPrice: Number(form.baseRentPrice),
      nextMaintenanceKm: Number(form.currentKm || 0) + Number(form.nextMaintenanceKm),
      damageRecordAmount: Number(form.damageRecordAmount || 0),
      companyId: Number(form.companyId || 1),
      isActive: form.isActive,
      insuranceEndDate: form.insuranceEndDate ? new Date(form.insuranceEndDate).toISOString() : null,
      cascoEndDate: form.cascoEndDate ? new Date(form.cascoEndDate).toISOString() : null,
      inspectionEndDate: form.inspectionEndDate ? new Date(form.inspectionEndDate).toISOString() : null,
    };

    try {
      // 1. Ruhsat Güncelle / Ekle
      const regMethod = editItem ? "PUT" : "POST";
      const regEndpoint = editItem ? `/api/v1/vehicle-registrations/${encodeURIComponent(editItem.registrationNumber || "")}` : "/api/v1/vehicle-registrations";

      await fetch(regEndpoint, {
        method: regMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regPayload)
      });

      // 2. Araç Güncelle / Ekle
      const vMethod = editItem ? "PUT" : "POST";
      const vEndpoint = editItem ? `/api/v1/vehicles/${encodeURIComponent(editItem.plate)}` : `/api/v1/vehicles`;

      const vRes = await fetch(vEndpoint, {
        method: vMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehiclePayload),
      });

      if (!vRes.ok) {
        const errText = await vRes.text();
        throw new Error(`Araç kaydedilemedi (Sunucu hatası: ${vRes.status}). Detay: ${errText}`);
      }

      toast.success(editItem ? "Araç ve Ruhsat güncellendi" : "Araç ve Ruhsat eklendi");
      setShowForm(false);
      fetchVehicles();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !deleteItem.plate) return;
    try {
      const res = await fetch(`/api/v1/vehicles/${encodeURIComponent(deleteItem.plate)}`, { method: 'DELETE' });
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
    { key: "plate", header: "Plaka", render: (v) => <span className="text-foreground">{v.plate}</span> },
    { key: "brandModel", header: "Marka / Model", render: (v) => v.brandModel || "—" },
    { key: "year", header: "Yıl", render: (v) => v.year },
    { key: "doc", header: "Ruhsat No", render: (v) => v.registrationNumber || "—" },
    { key: "company", header: "Şirket", render: (v) => {
        const c = companies.find(x => x.id === v.companyId);
        return c ? (c.companyName || c.name) : (v.companyId || "—");
      }
    },
    { key: "kasko", header: "Kasko Bitiş", render: (v) => formatDate(v.cascoEndDate) },
    { key: "insurance", header: "Sigorta Bitiş", render: (v) => formatDate(v.insuranceEndDate) },
    { key: "status", header: "Durum", render: (v) => {
        if ((v as any).isOnTrip) return <StatusBadge label="Seferde" variant="info" />;
        if ((v as any).isRented) return <StatusBadge label="Aktif (Kirada)" variant="warning" />;
        return <StatusBadge label={v.isActive ? "Aktif" : "Pasif"} variant={v.isActive ? "success" : "danger"} />;
      }
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Şirket Araçları</h2>
      <DataTable
        data={data}
        columns={columns}
        searchPlaceholder="Araç ara..."
        searchKeys={["plate", "brandModel"]}
        onAdd={openAdd}
        addLabel="Araç Ekle"
        onEdit={openEdit}
        onDelete={(v) => setDeleteItem(v)}
      />
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Araç Düzenle" : "Yeni Araç"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Şirket *">
            <select 
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground" 
              value={form.companyId || ""} 
              onChange={e => setForm({ ...form, companyId: Number(e.target.value) })}
            >
              <option value="">Şirket Seçiniz...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Plaka *"><Input value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} disabled={!!editItem} /></Field>
          <Field label="Marka / Model *"><Input value={form.brandModel || ""} onChange={e => setForm({ ...form, brandModel: e.target.value })} /></Field>
          <Field label="Ruhsat No"><Input value={form.registrationNumber || ""} onChange={e => setForm({ ...form, registrationNumber: e.target.value })} disabled={!!editItem} /></Field>
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
          <Field label="Bakıma Kalan KM"><Input type="number" placeholder="Örn: 5000" value={form.nextMaintenanceKm} onChange={e => setForm({ ...form, nextMaintenanceKm: Number(e.target.value) })} /></Field>

          <Field label="Durum (Aktif/Pasif)">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.isActive ? "true" : "false"} onChange={e => setForm({ ...form, isActive: e.target.value === "true" })}>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </Field>

          {/* Tarih Alanları */}
          <Field label="Sigorta Bitiş"><Input type="date" value={form.insuranceEndDate || ""} onChange={e => setForm({ ...form, insuranceEndDate: e.target.value })} /></Field>
          <Field label="Kasko Bitiş"><Input type="date" value={form.cascoEndDate || ""} onChange={e => setForm({ ...form, cascoEndDate: e.target.value })} /></Field>
          <Field label="Muayene Bitiş"><Input type="date" value={form.inspectionEndDate || ""} onChange={e => setForm({ ...form, inspectionEndDate: e.target.value })} /></Field>
        </div>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Araç Sil" message={`"${deleteItem?.plate}" plakalı aracı silmek istediğinize emin misiniz?`} />
    </div>
  );
}