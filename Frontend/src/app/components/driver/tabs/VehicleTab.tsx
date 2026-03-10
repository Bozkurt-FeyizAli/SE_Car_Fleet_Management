import React from "react";
import { Car, Truck, Calendar, FileText, Shield, Clock, Building2, Gauge, MapPin, DollarSign } from "lucide-react";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { vehicles, getCompanyName } from "../../../data/mockData";
import { currentDriver } from "../DriverPanel";

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function VehicleTab() {
  const vehicle = vehicles.find(v => v.current_driver_id === currentDriver.id);

  if (!vehicle) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Su anda atanmis araciniz bulunmamaktadir.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Aracim</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard icon={Car} label="Plaka" value={vehicle.plate_number} />
        <InfoCard icon={Truck} label="Marka / Model" value={`${vehicle.brand} ${vehicle.model}`} />
        <InfoCard icon={Calendar} label="Model Yili" value={vehicle.year} />
        <InfoCard icon={Car} label="Arac Tipi" value={vehicle.vehicle_type} />
        <InfoCard icon={FileText} label="Belge No" value={vehicle.document_number} />
        <InfoCard icon={Gauge} label="Kapasite" value={`${vehicle.capacity_kg.toLocaleString("tr-TR")} kg`} />
        <InfoCard icon={Shield} label="Kasko Bitis" value={new Date(vehicle.casco_expiry).toLocaleDateString("tr-TR")} />
        <InfoCard icon={Shield} label="Sigorta Bitis" value={new Date(vehicle.insurance_expiry).toLocaleDateString("tr-TR")} />
        <InfoCard icon={Calendar} label="Muayene Bitis" value={new Date(vehicle.inspection_expiry).toLocaleDateString("tr-TR")} />
        <InfoCard icon={Gauge} label="Sonraki Bakim" value={`${vehicle.next_maint_km.toLocaleString("tr-TR")} km`} />
        <InfoCard icon={DollarSign} label="Taban Fiyat" value={`₺${vehicle.base_price.toLocaleString("tr-TR")}`} />
        <InfoCard icon={Clock} label="Durum" value={<StatusBadge label={getStatusLabel(vehicle.status)} variant={getStatusVariant(vehicle.status)} />} />
        <InfoCard icon={MapPin} label="GPS" value={vehicle.gps_data ?? "Veri yok"} />
        <InfoCard icon={Building2} label="Sirket" value={getCompanyName(vehicle.company_id)} />
      </div>
    </div>
  );
}
