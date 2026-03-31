import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";

// Assuming we still need some mock fallback for name resolution if backend doesn't provide them,
// but let's try to just render the IDs or plates if names are unavailable.
import { companies, getCompanyName, getDriverFullName } from "../../../data/mockData";

export function RentalsTab() {
  const [data, setData] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [returnItem, setReturnItem] = useState<any | null>(null);
  const [form, setForm] = useState({ 
    renterCompanyId: "", 
    vehiclePlate: "", 
    dynamicPrice: 0, 
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

  const fetchAvailable = async () => {
    try {
      // Fetch vehicles available to rent out (or rent in). 
      // User requested: /api/v1/vehicles/available?companyId=...
      const result = await apiFetch(`/v1/vehicles/available?companyId=${currentCompany.id}`);
      if (Array.isArray(result)) setAvailableVehicles(result);
      else if (result && Array.isArray(result.data)) setAvailableVehicles(result.data);
    } catch (error: any) {
      // Silently fail or simple toast
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMyRentals();
    fetchAvailable();
  }, []);

  const calculatePrice = async (plate: string, days: number = 1) => {
    if (!plate) return;
    try {
      const result = await apiFetch(`/v1/vehicles/${plate}/calculate-price?days=${days}`);
      if (result && result.price) {
        setForm(prev => ({ ...prev, dynamicPrice: result.price }));
      } else if (typeof result === "number") {
         setForm(prev => ({ ...prev, dynamicPrice: result }));
      }
    } catch (error) {
      console.error("Fiyat hesaplanamadi", error);
    }
  };

  const handlePlateChange = (plate: string) => {
    setForm({ ...form, vehiclePlate: plate });
    // Attempt to calculate price for 1 day initially
    calculatePrice(plate, 1);
  };

  const openAdd = () => { 
    setForm({ renterCompanyId: "", vehiclePlate: "", dynamicPrice: 0, startDate: "", endDate: "", returnKm: 0 }); 
    setEditItem(null); 
    fetchAvailable();
    setShowForm(true); 
  };

  const handleSave = async () => {
    if (!form.renterCompanyId || !form.vehiclePlate || !form.startDate || !form.endDate) { 
      toast.error("Zorunlu alanlari doldurun"); 
      return; 
    }
    
    setLoading(true);
    try {
      await apiFetch("/v1/rentals/request", {
        method: "POST",
        body: JSON.stringify({
          vehiclePlate: form.vehiclePlate,
          renterCompanyId: Number(form.renterCompanyId),
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString()
        })
      });
      toast.success("Kiralama talebi basariyla olusturuldu");
      setShowForm(false);
      fetchMyRentals();
    } catch (error: any) {
      toast.error("Hata: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAction = async () => {
    if (!returnItem) return;
    try {
      await apiFetch(`/v1/rentals/${returnItem.id || returnItem.rentalId}/return`, {
        method: "PATCH",
        body: JSON.stringify({
          returnDate: new Date().toISOString(),
          returnKm: Number(form.returnKm) || 0
        })
      });
      toast.success("Arac basariyla iade edildi");
      setReturnItem(null);
      fetchMyRentals();
    } catch (error: any) {
      toast.error("Iade islemi basarisiz: " + error.message);
    }
  };

  const columns: Column<any>[] = [
    { key: "vehicle", header: "Arac", render: (r) => r.vehiclePlate || r.vehicle_id || "Bilinmiyor" },
    { key: "owner", header: "Kiraya Veren", render: (r) => r.ownerCompanyId ? getCompanyName(r.ownerCompanyId) : "Sirket" },
    { key: "renter", header: "Kiralayan", render: (r) => r.renterCompanyId ? getCompanyName(r.renterCompanyId) : "Sirket" },
    { key: "price", header: "Fiyat", render: (r) => `₺${(r.totalPrice || r.dynamicPrice || r.dynamic_price || 0).toLocaleString("tr-TR")}` },
    { key: "start", header: "Baslangic", render: (r) => new Date(r.startDate || r.start_date || new Date()).toLocaleDateString("tr-TR") },
    { key: "end", header: "Bitis", render: (r) => (r.endDate || r.end_date) ? new Date(r.endDate || r.end_date).toLocaleDateString("tr-TR") : "—" },
    { key: "status", header: "Durum", render: (r) => <StatusBadge label={getStatusLabel(r.status || "active")} variant={getStatusVariant(r.status || "active")} /> },
    { 
      key: "actions", 
      header: "Islemler", 
      render: (r) => (
        (r.status === "active" || r.status === "1") ? (
          <button 
            onClick={() => { setForm(prev => ({ ...prev, returnKm: 0 })); setReturnItem(r); }} 
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
          >
            Iade Et
          </button>
        ) : null
      ) 
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kiralayan Sirket *">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.renterCompanyId} onChange={e => setForm({ ...form, renterCompanyId: e.target.value })}>
              <option value="">Sec...</option>
              {companies.filter(c => c.id !== currentCompany.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Arac Plakasi *">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.vehiclePlate} onChange={e => handlePlateChange(e.target.value)}>
              <option value="">Sec...</option>
              {availableVehicles.map((v: any) => <option key={v.id || v.plate} value={v.plate || v.plate_number}>{v.plate || v.plateNumber || v.plate_number}</option>)}
            </select>
          </Field>
          <Field label="Hesaplanan Fiyat (TL)"><Input type="number" readOnly value={form.dynamicPrice} className="bg-slate-800" /></Field>
          <div className="hidden"></div>
          <Field label="Baslangic *"><Input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Bitis *"><Input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field>
        </div>
      </FormDialog>

      <ConfirmDialog 
        open={!!returnItem} 
        onClose={() => setReturnItem(null)} 
        onConfirm={handleReturnAction} 
        title="Araci Iade Et" 
        message={
          <div className="space-y-4">
            <p>Bu araci iade etmek istediginize emin misiniz? Lutfen guncel kilometreyi girin.</p>
            <Input 
              type="number" 
              placeholder="Donus KM" 
              value={form.returnKm || ""}
              onChange={e => setForm({ ...form, returnKm: Number(e.target.value) })}
            />
          </div>
        }
      />
    </div>
  );
}
