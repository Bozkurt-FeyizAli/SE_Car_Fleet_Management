import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { currentCompany } from "../ManagerPanel";
import { apiFetch } from "../../../utils/api";

// Fetch'den dönecek olan Swagger yapısına uygun interface
export interface ApiVehicleRegistration {
  registrationNumber: string;
  brandModel: string | null;
  year: number;
  type: string | null;
  capacity: number;
}

// --- GERÇEKÇİ RASTGELE VERİ ÜRETEÇLERİ ---
export const generatePlate = () => {
  const cities = ["01", "06", "07", "16", "34", "35", "41", "54"];
  const letters = "ABCDEFGHJKLMNPRSTUVYZ";
  const city = cities[Math.floor(Math.random() * cities.length)];
  
  // Format: 34 ABC 123
  let mid = "";
  const letterCount = Math.floor(Math.random() * 2) + 2; // 2 veya 3 harf
  for(let i=0; i<letterCount; i++) mid += letters[Math.floor(Math.random() * letters.length)];
  
  const end = Math.floor(10 + Math.random() * 899); // 2 veya 3 rakam
  return `${city} ${mid} ${end}`;
};

export const generateFutureDate = (monthsAhead = 6) => {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead + Math.floor(Math.random() * 12));
  return d.toISOString().split('T')[0];
};

export const generateRegNo = () => {
  const letters = "ABCDEFGHIJKLMNOPRSTUVYZ";
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(100000 + Math.random() * 899999);
  return `${l1}${l2}${num}`;
};

export const generateTCNo = () => {
  let digits = [];
  digits[0] = Math.floor(Math.random() * 9) + 1;
  for (let i = 1; i < 9; i++) digits[i] = Math.floor(Math.random() * 10);
  let oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  let evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  digits[9] = (oddSum * 7 - evenSum) % 10;
  let totalSum = 0;
  for (let i = 0; i < 10; i++) totalSum += digits[i];
  digits[10] = totalSum % 10;
  return digits.join("");
};

export const generateLicenseNo = () => Math.floor(100000 + Math.random() * 899999).toString();
// ------------------------------------------

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
  companyId: number;
  damageRecordAmount: number;
  // UI fields merged from registration
  brandModel?: string | null;
  year?: number;
  vehicleType?: string | null;
  capacityKg?: number;
  isRentedIntoCompany?: boolean;
}

export function VehiclesTab() {
  const [data, setData] = useState<ApiVehicle[]>([]);
  const [editItem, setEditItem] = useState<ApiVehicle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiVehicle | null>(null);
  const [returnItem, setReturnItem] = useState<ApiVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form objemizin state'inin varsayılan hali
  const getInitialForm = (): ApiVehicle => ({
    plate: "",
    brandModel: "",
    year: new Date().getFullYear(),
    vehicleType: "Kamyon",
    capacityKg: 0,
    registrationNumber: "",
    currentKm: 0,
    baseRentPrice: 0,
    isActive: true,
    insuranceEndDate: "",
    cascoEndDate: "",
    inspectionEndDate: "",
    nextMaintenanceKm: 0,
    companyId: currentCompany.id, 
    damageRecordAmount: 0,
  });

  const [form, setForm] = useState<ApiVehicle>(getInitialForm());

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const [vRes, rRes] = await Promise.all([
        fetch("/api/v1/vehicles"),
        fetch("/api/v1/vehicle-registrations")
      ]);
      
      if (!vRes.ok || !rRes.ok) throw new Error("Veriler yüklenemedi");
      
      const vehicles: ApiVehicle[] = await vRes.json();
      const regs: ApiVehicleRegistration[] = await rRes.json();

      let rentals: any[] = [];
      try {
        const rentRes = await apiFetch("/v1/rentals/my-rentals");
        rentals = Array.isArray(rentRes) ? rentRes : (rentRes?.data || []);
      } catch (err) {}

      // Aktif seferleri çek
      let activeTrips: any[] = [];
      try {
        const tripRes = await apiFetch(`/Trips/active/${currentCompany.id}`);
        activeTrips = Array.isArray(tripRes) ? tripRes : [];
      } catch (err) {}

      // Seferdeki araçların plakalarını topla
      const onTripPlates = new Set(
        activeTrips.map((t: any) => t.vehiclePlate).filter(Boolean)
      );

      // Aktif kiralamalar: iade edilmemiş olanlar
      // Kiralayan olarak aldığımız araçların plakaları
      const rentedInPlates = new Set(
        rentals
          .filter((r: any) => r.renterCompanyId === currentCompany.id && !r.returnDate)
          .map((r: any) => r.vehiclePlate)
      );

      // Kendi araçlarımızdan başka şirkete kiraya verilmiş olanları bul
      const rentedOutPlates = new Set(
        rentals
          .filter((r: any) => r.renterCompanyId !== currentCompany.id && !r.returnDate)
          .map((r: any) => r.vehiclePlate)
      );

      // Merge vehicle data with registration data
      const merged = vehicles.map(v => {
        const r = regs.find(reg => reg.registrationNumber === v.registrationNumber);
        return {
          ...v,
          brandModel: r?.brandModel,
          year: r?.year,
          vehicleType: r?.type,
          capacityKg: r?.capacity
        };
      });

      // Kendi araçlarımız + aktif kiralama ile aldığımız dış araçlar
      const companyVehicles = merged
        .filter(v => v.companyId === currentCompany.id || rentedInPlates.has(v.plate))
        .map(v => {
          // Seferdeki araç
          if (onTripPlates.has(v.plate)) {
            return { ...v, isOnTrip: true };
          }
          // Dışarıdan kiraladığımız araç (farklı şirketin aracı, bize kiralık gelmiş)
          if (v.companyId !== currentCompany.id && rentedInPlates.has(v.plate)) {
            return { ...v, isRentedIntoCompany: true };
          }
          // Kendi aracımız ama başka bir şirket tarafından kiralanmış
          if (v.companyId === currentCompany.id && rentedOutPlates.has(v.plate)) {
            return { ...v, isRentedOut: true };
          }
          return v;
        });
      setData(companyVehicles);
    } catch (e: any) {
      toast.error(e.message || "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchVehicles();
    const storedPerms = localStorage.getItem('managerPermissions');
    if (storedPerms) {
      try {
        setPermissions(JSON.parse(storedPerms));
      } catch (e) {}
    }
  }, []);

  const openAdd = () => {
    setForm({
      ...getInitialForm(),
      plate: generatePlate(),
      registrationNumber: generateRegNo(),
      year: 2020 + Math.floor(Math.random() * 6),
      baseRentPrice: 1500 + Math.floor(Math.random() * 3000),
      currentKm: Math.floor(Math.random() * 100000),
      insuranceEndDate: generateFutureDate(6),
      cascoEndDate: generateFutureDate(8),
      inspectionEndDate: generateFutureDate(12),
    });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: ApiVehicle) => {
    if (item.isRentedIntoCompany) {
      toast.info("Kiraladığınız dış araçların bilgilerini düzenleyemezsiniz.");
      return;
    }
    setForm({
      ...item,
      insuranceEndDate: item.insuranceEndDate ? item.insuranceEndDate.split('T')[0] : "",
      cascoEndDate: item.cascoEndDate ? item.cascoEndDate.split('T')[0] : "",
      inspectionEndDate: item.inspectionEndDate ? item.inspectionEndDate.split('T')[0] : "",
    });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.plate || !form.registrationNumber) {
      toast.error("Plaka ve Ruhsat No zorunludur");
      return;
    }

    const regPayload: ApiVehicleRegistration = {
      registrationNumber: form.registrationNumber,
      brandModel: form.brandModel || "Bilinmiyor",
      year: Number(form.year || new Date().getFullYear()),
      type: form.vehicleType || "Kamyon",
      capacity: Number(form.capacityKg || 0)
    };

    const vehiclePayload = {
      plate: editItem ? editItem.plate : form.plate,
      registrationNumber: editItem ? (editItem.registrationNumber || form.registrationNumber) : form.registrationNumber,
      currentKm: Number(form.currentKm),
      baseRentPrice: Number(form.baseRentPrice),
      nextMaintenanceKm: Number(form.nextMaintenanceKm),
      damageRecordAmount: Number(form.damageRecordAmount),
      companyId: currentCompany.id,
      isActive: form.isActive,
      insuranceEndDate: form.insuranceEndDate ? new Date(form.insuranceEndDate).toISOString() : null,
      cascoEndDate: form.cascoEndDate ? new Date(form.cascoEndDate).toISOString() : null,
      inspectionEndDate: form.inspectionEndDate ? new Date(form.inspectionEndDate).toISOString() : null,
    };

    try {
      // 1. Ruhsat Güncelle / Ekle
      const regMethod = editItem ? "PUT" : "POST";
      const regEndpoint = editItem ? `/api/v1/vehicle-registrations/${encodeURIComponent(editItem.registrationNumber || "")}` : "/api/v1/vehicle-registrations";
      
      const rRes = await fetch(regEndpoint, {
        method: regMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regPayload)
      });
      
      if (!rRes.ok && !editItem) {
          // Eğer yeni araç ekliyorsak ve ruhsat kaydı başarısızsa dur
          const rErr = await rRes.text();
          throw new Error("Ruhsat kaydı oluşturulamadı: " + rErr);
      }
      
      // 2. Araç Güncelle / Ekle
      const vMethod = editItem ? "PUT" : "POST";
      const vEndpoint = editItem ? `/api/v1/vehicles/${encodeURIComponent(editItem.plate)}` : `/api/v1/vehicles`;

      // Tarih zorunluluğu fix: Backend DateTime beklediği için boş bırakılamaz
      const fallbackDate = new Date().toISOString();

      const finalVehiclePayload = {
          ...vehiclePayload,
          insuranceEndDate: vehiclePayload.insuranceEndDate || fallbackDate,
          cascoEndDate: vehiclePayload.cascoEndDate || fallbackDate,
          inspectionEndDate: vehiclePayload.inspectionEndDate || fallbackDate,
      };

      const vRes = await fetch(vEndpoint, {
        method: vMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalVehiclePayload),
      });

      if (!vRes.ok) {
        const errorText = await vRes.text();
        throw new Error(`İşlem başarısız (Sunucu hatası: ${vRes.status}). Detay: ${errorText}`);
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
      if (!res.ok) {
        // Eğer backend silmeye izin vermiyorsa (Geçmiş kiralama/sefer bağlantısı varsa), aracı pasif duruma çekelim
        toast.info("Araç geçmiş işlemlere sahip olduğu için tamamen silinemedi. 'Pasif' duruma alınıyor...");
        
        // Aracı pasif yapmak için PUT isteği atıyoruz
        const passivePayload = {
          ...deleteItem,
          isActive: false
        };
        const putRes = await fetch(`/api/v1/vehicles/${encodeURIComponent(deleteItem.plate)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(passivePayload)
        });

        if (!putRes.ok) throw new Error("Aracı pasif duruma alma işlemi de başarısız oldu.");
        toast.success("Araç başarıyla pasif duruma alındı.");
      } else {
        toast.success("Araç tamamen silindi.");
      }

      setDeleteItem(null);
      fetchVehicles();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const handleQuickReturn = async () => {
    if (!returnItem) return;
    try {
      // 1. Önce aktif kiralamayı bul
      const rentals = await apiFetch("/v1/rentals/my-rentals");
      const activeRental = (Array.isArray(rentals) ? rentals : (rentals?.data || []))
        .find((r: any) => r.vehiclePlate === returnItem.plate && !r.returnDate);

      if (!activeRental) {
        toast.error("Aktif kiralama kaydı bulunamadı.");
        setReturnItem(null);
        return;
      }

      // 2. Kiralamayı iade et
      await apiFetch(`/v1/rentals/${activeRental.id || activeRental.rentalId}/return`, {
        method: "PATCH",
        body: JSON.stringify({
          returnDate: new Date().toISOString(),
          returnKm: returnItem.currentKm || 0
        })
      });

      // 3. Bağlantı Sıkıntısı Fix: Aktif seferi kapat
      try {
        const ownerId = returnItem.companyId; // returnItem bir Araç (ApiVehicle) nesnesi olduğu için companyId direkt alınabilir
        const activeTripsRes = await apiFetch(`/Trips/active/${ownerId || currentCompany.id}`);
        const activeTrips = Array.isArray(activeTripsRes) ? activeTripsRes : [];
        const tripToComplete = activeTrips.find((t: any) => t.vehiclePlate === returnItem.plate);
        
        if (tripToComplete) {
          await apiFetch(`/Trips/${tripToComplete.id || tripToComplete.tripId}/complete`, {
            method: "PATCH",
            body: JSON.stringify({
              endTime: new Date().toISOString(),
              endKm: returnItem.currentKm || 0
            })
          });
        }
      } catch (err) {}

      toast.success("Araç iade edildi ve listeden kaldırıldı.");
      setReturnItem(null);
      fetchVehicles();
    } catch (e: any) {
      toast.error("Hızlı iade başarısız: " + e.message);
    }
  };

  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("tr-TR");
  };

  const columns: Column<ApiVehicle>[] = [
    { key: "plate", header: "Plaka", render: (v) => (
      <div className="flex items-center gap-2">
        <span className="text-foreground">{v.plate}</span>
        {v.nextMaintenanceKm && v.currentKm !== undefined && (v.nextMaintenanceKm - v.currentKm <= 500) && (
          <div title={`Bakım yaklaştı! Kalan KM: ${Math.max(0, v.nextMaintenanceKm - v.currentKm)}`}>
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
        )}
      </div>
    ) },
    { key: "brandModel", header: "Marka / Model", render: (v) => v.brandModel || "—" },
    { key: "year", header: "Yıl", render: (v) => v.year || "—" },
    { key: "registration", header: "Ruhsat No", render: (v) => v.registrationNumber || "—" },
    { key: "currentKm", header: "Anlık KM", render: (v) => v.currentKm ? `${v.currentKm} km` : "0" },
    { key: "baseRent", header: "Günlük Kira", render: (v) => v.baseRentPrice ? `₺${v.baseRentPrice}` : "0" },
    { key: "status", header: "Durum", render: (v) => {
        if ((v as any).isOnTrip) return <StatusBadge label="Seferde" variant="info" />;
        if (v.isRentedIntoCompany) return <StatusBadge label="Kiralık" variant="info" />;
        if ((v as any).isRentedOut) return <StatusBadge label="Kiraya Verdik" variant="warning" />;
        return <StatusBadge label={v.isActive ? "Aktif" : "Pasif"} variant={v.isActive ? "success" : "danger"} />;
      }
    },
  ];

  const canAddVehicle = permissions.length === 0 || permissions.includes("arac:ekle");
  const canEditVehicle = permissions.length === 0 || permissions.includes("arac:duzenle");
  const canDeleteVehicle = permissions.length === 0 || permissions.includes("arac:sil");

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Şirket Araçları</h2>
      <DataTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Araç ara..." 
        searchKeys={["plate", "brandModel", "registrationNumber"]} 
        onAdd={canAddVehicle ? openAdd : undefined} 
        addLabel="Araç Ekle" 
        onEdit={canEditVehicle ? openEdit : undefined} 
        onDelete={canDeleteVehicle ? (v) => {
          if (v.isRentedIntoCompany) {
             setReturnItem(v);
             return;
          }
          setDeleteItem(v);
        } : undefined} 
      />

      {/* İade Et Onay Dialogu (Hızlı İade) */}
      <ConfirmDialog
        open={!!returnItem}
        onClose={() => setReturnItem(null)}
        onConfirm={handleQuickReturn}
        title="Aracı İade Et"
        message={
          <div className="space-y-4">
            <p><strong>{returnItem?.plate}</strong> plakalı kiralık aracı şimdi iade etmek istiyor musunuz?</p>
            <div className="text-sm bg-muted rounded-md p-3">
              <p>Araç şu anki konumuyla ve kilometresiyle ({returnItem?.currentKm} km) iade edilecektir.</p>
            </div>
          </div>
        }
      />
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Araç Düzenle" : "Yeni Araç"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <Field label="Anlık Kilometre (KM)"><Input type="number" value={form.currentKm} onChange={e => setForm({ ...form, currentKm: Number(e.target.value) })} /></Field>
          <Field label="Hasar Kaydı Tutarı (TL)"><Input type="number" value={form.damageRecordAmount} onChange={e => setForm({ ...form, damageRecordAmount: Number(e.target.value) })} /></Field>
          
          <Field label="Taban Fiyat (TL)"><Input type="number" value={form.baseRentPrice} onChange={e => setForm({ ...form, baseRentPrice: Number(e.target.value) })} /></Field>
          <Field label="Sonraki Bakım KM"><Input type="number" value={form.nextMaintenanceKm} onChange={e => setForm({ ...form, nextMaintenanceKm: Number(e.target.value) })} /></Field>
          
          <Field label="Durum (Aktif/Pasif)">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.isActive ? "true" : "false"} onChange={e => setForm({ ...form, isActive: e.target.value === "true" })}>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </Field>
          <div className="hidden"></div>
          
          <Field label="Sigorta Bitiş"><Input type="date" value={form.insuranceEndDate || ""} onChange={e => setForm({ ...form, insuranceEndDate: e.target.value })} /></Field>
          <Field label="Kasko Bitiş"><Input type="date" value={form.cascoEndDate || ""} onChange={e => setForm({ ...form, cascoEndDate: e.target.value })} /></Field>
          <Field label="Muayene Bitiş"><Input type="date" value={form.inspectionEndDate || ""} onChange={e => setForm({ ...form, inspectionEndDate: e.target.value })} /></Field>
        </div>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Araç Sil" message={`"${deleteItem?.plate}" plakalı aracı silmek istediğinize emin misiniz?`} />
    </div>
  );
}