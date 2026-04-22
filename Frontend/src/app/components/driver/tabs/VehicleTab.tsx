import React, { useState, useEffect } from "react";
import { Car, Truck, Calendar, FileText, Shield, Clock, Building2, Gauge, MapPin, DollarSign } from "lucide-react";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { ApiVehicle } from "../../manager/tabs/VehiclesTab";
import { ApiUser } from "../../system-admin/tabs/DriversTab";

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
  const [vehicle, setVehicle] = useState<ApiVehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssignedVehicle() {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No auth token");

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decodedToken = JSON.parse(jsonPayload);
        const email = decodedToken.email || decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || decodedToken.name;

        // Fetch users to find current driver
        const userRes = await fetch("/api/User");
        if (!userRes.ok) throw new Error("Failed to load users");
        const users: ApiUser[] = await userRes.json();
        const currentUser = users.find(u => u.email === email);

        if (currentUser) {
          // ÖNEMLİ: Araç ataması Drivers tablosunda tutulduğu için bu listeyi de çekmeliyiz
          const driversRes = await fetch("/api/Drivers");
          let assignedPlate = "";
          
          if (driversRes.ok) {
            const driversList = await driversRes.json();
            const matchingDriver = driversList.find((d: any) => d.userId === currentUser.id);
            if (matchingDriver) {
              assignedPlate = matchingDriver.vehiclePlate;
            }
          }

          // Eğer Drivers tablosundan gelmediyse localStorage fallback kullan
          const localVehiclePlate = localStorage.getItem(`driver_vehicle_plate_${currentUser.id}`);
          const vehiclePlate = assignedPlate || currentUser.assignedVehiclePlate || localVehiclePlate;

          if (vehiclePlate) {
            const vRes = await fetch(`/api/v1/vehicles`);
            if (vRes.ok) {
              const vData: ApiVehicle[] = await vRes.json();
              const matched = vData.find(v => v.plate === vehiclePlate);
              setVehicle(matched || null);
            }
          }
        }
      } catch (err) {
        console.error("Araç bilgisi yüklenemedi", err);
      } finally {
        setLoading(false);
      }
    }
    loadAssignedVehicle();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Araç bilgisi yükleniyor...</p>
      </div>
    );
  }

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
        <InfoCard icon={Car} label="Plaka" value={vehicle.plate} />
        <InfoCard icon={FileText} label="Ruhsat No" value={vehicle.registrationNumber || "—"} />
        <InfoCard icon={Gauge} label="Anlık Kilometre" value={`${(vehicle.currentKm || 0).toLocaleString("tr-TR")} km`} />
        <InfoCard icon={DollarSign} label="Hasar Kaydı" value={`₺${(vehicle.damageRecordAmount || 0).toLocaleString("tr-TR")}`} />
        <InfoCard icon={Shield} label="Kasko Bitiş" value={vehicle.cascoEndDate ? new Date(vehicle.cascoEndDate).toLocaleDateString("tr-TR") : "—"} />
        <InfoCard icon={Shield} label="Sigorta Bitiş" value={vehicle.insuranceEndDate ? new Date(vehicle.insuranceEndDate).toLocaleDateString("tr-TR") : "—"} />
        <InfoCard icon={Calendar} label="Muayene Bitiş" value={vehicle.inspectionEndDate ? new Date(vehicle.inspectionEndDate).toLocaleDateString("tr-TR") : "—"} />
        <InfoCard icon={Gauge} label="Sonraki Bakım" value={`${(vehicle.nextMaintenanceKm || 0).toLocaleString("tr-TR")} km`} />
        <InfoCard icon={DollarSign} label="Taban Fiyat" value={`₺${(vehicle.baseRentPrice || 0).toLocaleString("tr-TR")}`} />
        <InfoCard icon={Clock} label="Durum" value={<StatusBadge label={vehicle.isActive ? "Aktif" : "Pasif"} variant={vehicle.isActive ? "success" : "neutral"} />} />
      </div>
    </div>
  );
}
