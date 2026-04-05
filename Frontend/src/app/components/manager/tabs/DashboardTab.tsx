import React, { useState, useEffect } from "react";
import { Users, Truck, Car, ArrowLeftRight, ShoppingCart, CreditCard, TrendingUp, AlertTriangle, MapPin } from "lucide-react";
import { StatCard } from "../../shared/StatCard";
import { StatusBadge } from "../../shared/StatusBadge";
import { currentCompany } from "../ManagerPanel";
import { interCompanyRentals, orders, payments } from "../../../data/mockData";
import { ApiUser } from "./DriversTab";
import { ApiVehicle } from "./VehiclesTab";
import { apiFetch } from "../../../utils/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom truck icon for active trips
const truckIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: "hue-rotate-[120deg]", // Make it green-ish
});

export function DashboardTab() {
  const companyId = currentCompany.id;
  
  const [compDrivers, setCompDrivers] = useState<ApiUser[]>([]);
  const [compVehicles, setCompVehicles] = useState<ApiVehicle[]>([]);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    // Tüm şoförleri, araçları, lokasyonları ve aktif seferleri çekelim
    Promise.all([
      fetch("/api/User").then(r => r.ok ? r.json() : []),
      fetch("/api/v1/vehicles").then(r => r.ok ? r.json() : []),
      apiFetch(`/Trips/active/${companyId}`).catch(() => []),
      apiFetch(`/Locations/company/${companyId}`).catch(() => [])
    ]).then(([usersData, vehiclesData, tripsData, locsData]) => {
      setCompDrivers(usersData.filter((u: any) => u.roleId === 3 && u.email !== "admin@fleet.com"));
      setCompVehicles(vehiclesData);
      setActiveTrips(Array.isArray(tripsData) ? tripsData : []);
      setLocations(Array.isArray(locsData) ? locsData : []);
    }).catch(console.error);
  }, [companyId]);

  const compRentals = interCompanyRentals.filter(r => r.owner_comp_id === companyId || r.renter_comp_id === companyId);
  const compOrders = orders.filter(o => o.company_id === companyId);
  const compPayments = payments.filter(p => p.company_id === companyId);

  const totalIncome = compPayments.filter(p => p.payment_type === "incoming").reduce((s, p) => s + p.amount, 0);
  const totalExpense = compPayments.filter(p => p.payment_type === "outgoing").reduce((s, p) => s + p.amount, 0);
  
  const totalScore = compDrivers.reduce((s, d) => s + (d.driverScore || 0), 0);
  const avgScore = compDrivers.length > 0 ? (totalScore / compDrivers.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h2>{currentCompany.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{currentCompany.address} &middot; {currentCompany.phone}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} label="Şoförler" value={compDrivers.length} subtext={`${activeTrips.length} seferde`} color="bg-emerald-600" />
        <StatCard icon={Car} label="Araçlar" value={compVehicles.length} subtext={`${compVehicles.filter(v => v.isActive).length} aktif`} color="bg-blue-600" />
        <StatCard icon={TrendingUp} label="Aktif Seferler" value={activeTrips.length} subtext={`Ort. puan: ${avgScore}`} color="bg-violet-600" />
        <StatCard icon={ShoppingCart} label="Siparişler" value={compOrders.length} subtext={`${compOrders.filter(o => o.status === "pending").length} beklemede`} color="bg-orange-600" />
        <StatCard icon={CreditCard} label="Gelir" value={`₺${totalIncome.toLocaleString("tr-TR")}`} color="bg-teal-600" />
        <StatCard icon={CreditCard} label="Gider" value={`₺${totalExpense.toLocaleString("tr-TR")}`} color="bg-red-500" />
        <StatCard icon={ArrowLeftRight} label="Kiralamalar" value={compRentals.filter(r => r.status === "active").length} subtext="aktif" color="bg-cyan-600" />
        <StatCard icon={AlertTriangle} label="Devre Dışı Araçlar" value={compVehicles.filter(v => !v.isActive).length} color="bg-amber-600" />
      </div>

      {/* CANLI ARAÇ HARİTASI (Aktif Seferler) */}
      <div>
        <h3 className="mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-500" /> Canlı Harita (Seferdeki Araçlar)</h3>
        <div className="h-[350px] w-full rounded-lg overflow-hidden border border-border shadow-sm z-0">
          <MapContainer center={[41.0082, 28.9784]} zoom={11} style={{ height: "100%", width: "100%", zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {activeTrips.map(trip => {
              const startLoc = locations.find(l => l.id === trip.startLocationId);
              if (!startLoc) return null;
              return { trip, startLoc };
            }).filter(Boolean).map(({ trip, startLoc }: any) => {
              const endLoc = locations.find(l => l.id === trip.endLocationId);
              // Şu anki versiyonda sadece başlangıç lokasyonlarını çiziyoruz (canlı GPS'i simüle ediyoruz)
              return (
                <Marker key={trip.id || trip.tripId} position={[startLoc.latitude, startLoc.longitude]} icon={truckIcon}>
                  <Popup>
                    <div className="text-sm">
                      <strong>Araç Plaka:</strong> {trip.vehiclePlate} <br/>
                      <strong>Sürücü ID:</strong> {trip.driverId} <br/>
                      <strong>Nereden:</strong> {startLoc.locationName} <br/>
                      <strong>Nereye:</strong> {endLoc ? endLoc.locationName : "Bilinmiyor"} <br/>
                      <span className="text-xs text-blue-600 mt-1 inline-block">Şu an Seferde</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div>
          <h3 className="mb-3">Son Siparişler</h3>
          <div className="rounded-lg border border-border divide-y divide-border">
            {compOrders.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Bu şirkete ait sipariş bulunamadı.</div>
            ) : (
              compOrders.slice(-4).reverse().map(order => (
                <div key={order.id} className="px-3 sm:px-4 py-3 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{order.order_number} — {order.customer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.pickup_address} → {order.delivery_address}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm">₺{order.price.toLocaleString("tr-TR")}</span>
                      <StatusBadge label={order.status === "pending" ? "Beklemede" : order.status === "picked_up" ? "Tasiniyor" : "Teslim Edildi"} variant={order.status === "pending" ? "warning" : order.status === "picked_up" ? "info" : "success"} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Driver Scores */}
        <div>
          <h3 className="mb-3">Şoför Puanları</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {compDrivers.map(d => {
              const score = d.driverScore ?? 0;
              const isOnTrip = activeTrips.some((t: any) => t.driverId === d.id);
              const status = isOnTrip ? "on_trip" : (d.driverTripStatus || "inactive");
              const variant = isOnTrip ? "info" : status === "active" ? "success" : "neutral";
              const label = isOnTrip ? "Seferde" : status === "active" ? "Aktif" : "Pasif";
              return (
                <div key={d.id} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                  <div>
                    <p className="text-sm">{d.firstName} {d.lastName}</p>
                    <StatusBadge label={label} variant={variant} />
                  </div>
                  <div className={`text-xl font-bold ${score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500"}`}>
                    {score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}