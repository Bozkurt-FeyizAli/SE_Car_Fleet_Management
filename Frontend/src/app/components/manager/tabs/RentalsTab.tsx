import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";

// Using live fetching for companies instead of mockData
export function RentalsTab() {
  const [data, setData] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [liveCompanies, setLiveCompanies] = useState<any[]>([]);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [returnItem, setReturnItem] = useState<any | null>(null);
  const [form, setForm] = useState({
    ownerCompanyId: "",
    vehiclePlate: "",
    dynamicPrice: 0,
    dailyPrice: 0,
    rentalDays: 0,
    startDate: "",
    endDate: "",
    returnKm: 0
  });

  const [loading, setLoading] = useState(false);

  const fetchMyRentals = async () => {
    try {
      const result = await apiFetch("/v1/rentals/my-rentals");
      if (Array.isArray(result)) setData(result);
      else if (result && Array.isArray(result.data)) setData(result.data); // in case it is wrapped
      else setData([]);
    } catch (error: any) {
      toast.error("Kiralamalar getirilemedi: " + error.message);
    }
  };

  const fetchAvailable = async (ownerId: number | string) => {
    if (!ownerId) {
      setAvailableVehicles([]);
      return;
    }
    try {
      // Tüm araçları ve aktif kiralamaları çek, halihazırda kirada olanları filtrele
      const [vehiclesResult, rentalsResult] = await Promise.all([
        apiFetch(`/v1/vehicles`),
        apiFetch(`/v1/rentals/my-rentals`).catch(() => [])
      ]);
      
      const vehicles = Array.isArray(vehiclesResult) ? vehiclesResult : (vehiclesResult?.data || []);
      const rentals = Array.isArray(rentalsResult) ? rentalsResult : (rentalsResult?.data || []);
      
      // Aktif (iade edilmemiş) kiralamalardaki plakaları bul
      const activelyRentedPlates = new Set(
        rentals.filter((r: any) => !r.returnDate).map((r: any) => r.vehiclePlate)
      );
      
      // Seçilen şirketin araçlarından, aktif ve kirada olmayanları göster
      const filtered = vehicles.filter((v: any) => 
        v.companyId === Number(ownerId) && v.isActive && !activelyRentedPlates.has(v.plate)
      );
      setAvailableVehicles(filtered);
    } catch (error: any) {
      console.error(error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const result = await fetch("/api/v1/companies");
      if (result.ok) {
        setLiveCompanies(await result.json());
      }
    } catch(e) {}
  };

  const fetchAllVehicles = async () => {
    try {
      const res = await fetch("/api/v1/vehicles");
      if (res.ok) setAllVehicles(await res.json());
    } catch(e) {}
  };

  useEffect(() => {
    fetchMyRentals();
    fetchCompanies();
    fetchAllVehicles();
  }, []);

  const getLiveCompanyName = (id: number) => {
    const comp = liveCompanies.find((c: any) => c.id === id);
    return comp ? (comp.companyName || comp.name) : "Bilinmiyor";
  };

  const calculatePrice = async (plate: string, days: number = 1) => {
    if (!plate || days <= 0) return;
    try {
      const result = await apiFetch(`/v1/vehicles/${encodeURIComponent(plate)}/calculate-price?days=${days}`);
      if (result && result.totalEstimatedPrice !== undefined) {
        const perDay = result.finalPricePerDay || (result.totalEstimatedPrice / days);
        setForm(prev => ({ ...prev, dynamicPrice: result.totalEstimatedPrice, dailyPrice: perDay, rentalDays: days }));
      } else {
        // Fallback: araç listesinden baseRentPrice al
        const v = availableVehicles.find((v: any) => v.plate === plate);
        const base = v?.baseRentPrice || 0;
        setForm(prev => ({ ...prev, dynamicPrice: base * days, dailyPrice: base, rentalDays: days }));
      }
    } catch (error) {
      // Backend hesaplaması başarısız olursa, araç listesindeki taban fiyatı kullan
      const v = availableVehicles.find((v: any) => v.plate === plate);
      const base = v?.baseRentPrice || 0;
      setForm(prev => ({ ...prev, dynamicPrice: base * days, dailyPrice: base, rentalDays: days }));
    }
  };

  useEffect(() => {
    if (form.vehiclePlate && form.startDate && form.endDate) {
      const start = new Date(form.startDate).getTime();
      const end = new Date(form.endDate).getTime();
      const diffDays = Math.ceil((end - start) / (1000 * 3600 * 24));
      if (diffDays > 0) {
        calculatePrice(form.vehiclePlate, diffDays);
      }
    }
  }, [form.vehiclePlate, form.startDate, form.endDate]);

  const handlePlateChange = (plate: string) => {
    setForm({ ...form, vehiclePlate: plate });
    // Attempt to calculate price for 1 day initially
    calculatePrice(plate, 1);
  };

  const openAdd = () => {
    setForm({ ownerCompanyId: "", vehiclePlate: "", dynamicPrice: 0, dailyPrice: 0, rentalDays: 0, startDate: "", endDate: "", returnKm: 0 });
    setEditItem(null);
    setAvailableVehicles([]);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.ownerCompanyId || !form.vehiclePlate || !form.startDate || !form.endDate) {
      toast.error("Zorunlu alanlari doldurun");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/v1/rentals/request", {
        method: "POST",
        body: JSON.stringify({
          vehiclePlate: form.vehiclePlate,
          renterCompanyId: currentCompany.id,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          rentStartKm: Number(getVehicleKm(form.vehiclePlate) || 0)
        })
      });
      toast.success("Kiralama talebi başarıyla oluşturuldu");
      setShowForm(false);
      fetchMyRentals();
      fetchAllVehicles(); // Araç durumlarını güncelle
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAction = async () => {
    if (!returnItem) return;
    try {
      // 1. Önce kiralamayı iade et
      await apiFetch(`/v1/rentals/${returnItem.id || returnItem.rentalId}/return`, {
        method: "PATCH",
        body: JSON.stringify({
          returnDate: new Date().toISOString(),
          returnKm: Number(form.returnKm) || 0,
          totalPrice: Number(returnItem.totalPrice) || 0
        })
      });

      // 2. Bağlantı Sıkıntısı Fix: Eğer araç iade edildiyse ama üzerinde hala aktif bir SEFER kalmışsa onu da kapat.
      // Aksi halde araçlar tablosunda "Seferde" olarak takılı kalır.
      try {
        const ownerId = getOwnerCompanyId(returnItem.vehiclePlate);
        const activeTripsRes = await apiFetch(`/Trips/active/${ownerId || currentCompany.id}`);
        const activeTrips = Array.isArray(activeTripsRes) ? activeTripsRes : [];
        const tripToComplete = activeTrips.find((t: any) => t.vehiclePlate === returnItem.vehiclePlate);
        
        if (tripToComplete) {
          await apiFetch(`/Trips/${tripToComplete.id || tripToComplete.tripId}/complete`, {
            method: "PATCH",
            body: JSON.stringify({
              endTime: new Date().toISOString(),
              endKm: Number(form.returnKm) || 0
            })
          });
          console.log(`Otomatik Sefer Kapatma: ${returnItem.vehiclePlate} plakasının ${tripToComplete.id} nolu seferi kapatıldı.`);
        }
      } catch (err) {
        console.warn("Otomatik sefer kapatma sırasında hata (görmezden gelinebilir):", err);
      }

      toast.success("Araç başarıyla iade edildi ve seferler güncellendi");
      setReturnItem(null);
      fetchMyRentals();
      fetchAllVehicles(); 
    } catch (error: any) {
      toast.error("İade işlemi başarısız: " + error.message);
    }
  };

  const getVehicleKm = (plate: string) => {
    const v = allVehicles.find((v: any) => v.plate === plate);
    return v ? v.currentKm : null;
  };

  // Araç sahibi şirket ID'sini araç listesinden bul
  const getOwnerCompanyId = (plate: string) => {
    const v = allVehicles.find((v: any) => v.plate === plate);
    return v ? v.companyId : null;
  };

  const columns: Column<any>[] = [
    { key: "vehicle", header: "Araç", render: (r) => r.vehiclePlate || "Bilinmiyor" },
    { key: "owner", header: "Araç Sahibi", render: (r) => {
        const ownerId = getOwnerCompanyId(r.vehiclePlate);
        return ownerId ? getLiveCompanyName(ownerId) : "—";
      }
    },
    { key: "renter", header: "Kiralayan", render: (r) => r.renterCompanyId ? getLiveCompanyName(r.renterCompanyId) : "Şirket" },
    { key: "rentKm", header: "Kira KM", render: (r) => `${Number(r.rentStartKm || 0).toLocaleString("tr-TR")} km` },
    { key: "price", header: "Toplam Ücret", render: (r) => `₺${(r.totalPrice || 0).toLocaleString("tr-TR")}` },
    { key: "start", header: "Başlangıç", render: (r) => new Date(r.startDate).toLocaleDateString("tr-TR") },
    { key: "end", header: "Bitiş", render: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString("tr-TR") : "—" },
    { key: "return", header: "İade Tarihi", render: (r) => r.returnDate ? new Date(r.returnDate).toLocaleDateString("tr-TR") : "—" },
    { key: "status", header: "Durum", render: (r) => {
        const ownerId = getOwnerCompanyId(r.vehiclePlate);
        const isActive = !r.returnDate; // backend Spec: iade_tarihi NULL ise devam ediyor
        
        if (isActive) {
          if (ownerId === currentCompany.id) {
            return <StatusBadge label="Kiraya Verdik" variant="warning" />;
          }
          return <StatusBadge label="Kiralık" variant="info" />;
        }
        
        return <StatusBadge label="İade Edildi" variant="neutral" />;
      }
    },
    {
      key: "actions",
      header: "İşlemler",
      render: (r) => {
        const isActive = !r.returnDate;
        // Sadece kiralayan taraf (biz seksek) iade edebilir
        const isRenter = r.renterCompanyId === currentCompany.id;
        
        return (isActive && isRenter) ? (
          <button
            onClick={() => { setForm(prev => ({ ...prev, returnKm: 0 })); setReturnItem(r); }}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
          >
            İade Et
          </button>
        ) : null;
      }
    }
  ];

  return (
    <div>
      <h2 className="mb-4">Kiralik Araclar</h2>
      <DataTable
        data={data}
        columns={columns}
        searchPlaceholder="Kiralama ara..."
        searchKeys={["vehiclePlate"]}
        onAdd={openAdd}
        addLabel="Kiralama Talebi"
      />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title="Yeni Kiralama Talebi" onSubmit={handleSave} wide>
        <div className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <StatusBadge label="BİLGİ" variant="info" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 font-medium">
                  Fiyat Hesaplama Mantığı: <br/>
                  <span className="text-xs font-normal">Fiyat = Taban Fiyat × KM Çarpanı × Hasar Çarpanı × Gün Sayısı</span>
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Araç Sahibi Şirket *">
              <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.ownerCompanyId} onChange={e => {
                const oId = e.target.value;
                setForm({ ...form, ownerCompanyId: oId, vehiclePlate: "", dynamicPrice: 0 });
                fetchAvailable(oId);
              }}>
                <option value="">Sec...</option>
                {liveCompanies.filter(c => c.id !== currentCompany.id).map(c => <option key={c.id} value={c.id}>{c.companyName || c.name}</option>)}
              </select>
            </Field>
            <Field label="Araç Plakası *">
              <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.vehiclePlate} onChange={e => handlePlateChange(e.target.value)}>
                <option value="">Seç...</option>
                {availableVehicles.map((v: any) => <option key={v.id || v.plate} value={v.plate}>{v.plate} - Günlük ₺{(v.baseRentPrice || 0).toLocaleString("tr-TR")}</option>)}
              </select>
            </Field>
            <Field label="Başlangıç Tarihi *"><Input type="date" value={form.startDate?.split('T')[0] || ""} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
            <Field label="Bitiş Tarihi *"><Input type="date" value={form.endDate?.split('T')[0] || ""} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field>
            <Field label={`Hesaplanan Tahmini Ücret (${form.rentalDays > 0 ? form.rentalDays + ' gün' : 'TL'})`}>
              <Input type="number" readOnly value={form.dynamicPrice} className="bg-muted text-foreground font-bold text-lg" />
            </Field>
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={!!returnItem}
        onClose={() => setReturnItem(null)}
        onConfirm={handleReturnAction}
        title="Aracı İade Et"
        message={
          <div className="space-y-4">
            <p><strong>{returnItem?.vehiclePlate}</strong> plakalı aracı iade etmek istediğinize emin misiniz?</p>
            {returnItem && (
              <div className="text-sm bg-muted rounded-md p-3 space-y-1">
                <p>Kiralama Başlangıç KM: <strong>{Number(returnItem.rentStartKm || 0).toLocaleString("tr-TR")} km</strong></p>
                <p>Aracın Güncel KM: <strong>{Number(getVehicleKm(returnItem.vehiclePlate) || 0).toLocaleString("tr-TR")} km</strong></p>
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Dönüş KM (Güncel Kilometre) *</label>
              <Input
                type="number"
                placeholder={`Örn: ${Number(getVehicleKm(returnItem?.vehiclePlate) || 0) + 100}`}
                value={form.returnKm || ""}
                onChange={e => setForm({ ...form, returnKm: Number(e.target.value) })}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
