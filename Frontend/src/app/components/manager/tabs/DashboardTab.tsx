import React, { useState, useEffect } from "react";
import { Users, Truck, Car, ArrowLeftRight, ShoppingCart, CreditCard, TrendingUp, AlertTriangle, MapPin } from "lucide-react";
import { StatCard } from "../../shared/StatCard";
import { StatusBadge } from "../../shared/StatusBadge";
import { currentCompany } from "../ManagerPanel";
import { ApiUser } from "./DriversTab";
import { ApiVehicle } from "./VehiclesTab";
import { apiFetch } from "../../../utils/api";
import * as signalR from "@microsoft/signalr";
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

// Create a custom truck icon using DivIcon
const truckDivIcon = new L.DivIcon({
  html: `<div style="font-size: 24px; background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid #10b981; transform: scaleX(-1);">🚚</div>`,
  className: "custom-truck-icon bg-transparent border-none",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export function DashboardTab() {
  const companyId = currentCompany.id;
  
  const [compDrivers, setCompDrivers] = useState<ApiUser[]>([]);
  const [compVehicles, setCompVehicles] = useState<ApiVehicle[]>([]);
  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  
  // Canlı Simülasyon State'leri
  const [tripRoutes, setTripRoutes] = useState<Record<number, [number, number][]>>({});
  const [tripPositions, setTripPositions] = useState<Record<number, [number, number]>>({});
  const [tripProgress, setTripProgress] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchData = () => {
      // Tüm şoförleri, araçları, lokasyonları ve aktif seferleri çekelim
      Promise.all([
        fetch("/api/User", { cache: "no-store" }).then(r => r.ok ? r.json() : []),
        fetch("/api/v1/vehicles", { cache: "no-store" }).then(r => r.ok ? r.json() : []),
        apiFetch(`/Trips/active/${companyId}`).catch(() => []),
        apiFetch(`/Locations/company/${companyId}`).catch(() => [])
      ]).then(([usersData, vehiclesData, tripsData, locsData]) => {
        setCompDrivers(usersData.filter((u: any) => {
          if (u.companyId !== companyId) return false;
          const rid = u.roleId !== undefined && u.roleId !== null ? u.roleId : u.role;
          return rid === 2; // Sürücü
        }));
        setCompVehicles(vehiclesData.filter((v: any) => v.companyId === companyId));
        setActiveTrips(Array.isArray(tripsData) ? tripsData : []);
        setLocations(Array.isArray(locsData) ? locsData : []);
      }).catch(console.error);

      // Aktif kiralamaları çek
      apiFetch("/v1/rentals/my-rentals").then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setRentals(list.filter((r: any) => !r.returnDate));
      }).catch(() => {});
    };

    // İlk yükleme
    fetchData();

    // YENİ: SignalR ile WebSocket üzerinden anlık güncelleme bağlantısı
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://mikbalceyhan.me/fleetHub")
      .withAutomaticReconnect()
      .build();

    connection.start().catch((err: any) => console.error("SignalR Connection Error:", err));

    // Backend'in güncellemeleri fırlattığı event adları:
    connection.on("ReceiveUpdate", fetchData);
    connection.on("UpdateVehicleStatus", fetchData);

    return () => {
      connection.stop();
    };
  }, [companyId]);

  // OSRM Rota Çekme ve Animasyon Loop
  useEffect(() => {
    if (activeTrips.length === 0 || locations.length === 0) return;

    const fetchRoute = async (tripId: number, start: any, end: any) => {
      if (tripRoutes[tripId]) return;
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          // OSRM coordinates are [longitude, latitude]
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]); // Leaflet uses [latitude, longitude]
          setTripRoutes(prev => ({...prev, [tripId]: coords}));
        }
      } catch (e) {
        console.error("OSRM Fetch Error:", e);
      }
    };

    activeTrips.forEach(trip => {
      const tid = trip.id || trip.tripId;
      const startLoc = locations.find(l => l.id === trip.startLocationId);
      const endLoc = locations.find(l => l.id === trip.endLocationId);
      if (startLoc && endLoc && !tripRoutes[tid]) {
        fetchRoute(tid, startLoc, endLoc);
      }
    });
  }, [activeTrips, locations, tripRoutes]);

  // Canlı Animasyon Loop - Her 2 saniyede bir
  useEffect(() => {
    if (activeTrips.length === 0) return;

    const interval = setInterval(() => {
      const newPositions: Record<number, [number, number]> = {};
      const newProgress: Record<number, number> = {};

      activeTrips.forEach(trip => {
        const tid = trip.id || trip.tripId;
        const coords = tripRoutes[tid];
        const startLoc = locations.find(l => l.id === trip.startLocationId);
        
        if (coords && coords.length > 0) {
          // Gerçekçi olması ve anında teleport olmaması için 2 saat (7200000 ms) simülasyon yap.
          // Ve süreyi modulo ile ezerek aracın sürekli hareket etmesini (görsellik için) sağla.
          const DUR = 7200000; 
          const start = trip.startTime ? new Date(trip.startTime).getTime() : Date.now() - 300000;
          const elapsed = Date.now() - start;
          let progress = (elapsed % DUR) / DUR;
          
          if (trip.status === "InTrip" && progress >= 1) progress = 0.99;

          const index = Math.floor(progress * (coords.length - 1));
          newPositions[tid] = coords[index];
          newProgress[tid] = Math.round(progress * 100);
        } else if (startLoc) {
          newPositions[tid] = [startLoc.latitude, startLoc.longitude];
          newProgress[tid] = 0;
        }
      });

      setTripPositions(prev => ({...prev, ...newPositions}));
      setTripProgress(prev => ({...prev, ...newProgress}));
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTrips, tripRoutes, locations]);

  const totalScore = compDrivers.reduce((s, d) => s + (d.driverScore || 0), 0);
  const avgScore = compDrivers.length > 0 ? (totalScore / compDrivers.length).toFixed(1) : "0";

  // Sefer ücretleri toplamı
  const totalTripFees = activeTrips.reduce((s, t) => s + (Number(t.totalFee) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2>{currentCompany.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{currentCompany.address} &middot; {currentCompany.phone}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} label="Şoförler" value={compDrivers.length} subtext={`${activeTrips.length} seferde`} color="bg-emerald-600" />
        <StatCard icon={Car} label="Araçlar" value={compVehicles.length} subtext={`${compVehicles.filter(v => v.isActive || activeTrips.some(t => t.vehiclePlate === v.plate)).length} aktif`} color="bg-blue-600" />
        <StatCard icon={TrendingUp} label="Aktif Seferler" value={activeTrips.length} subtext={`Ort. puan: ${avgScore}`} color="bg-violet-600" />
        <StatCard icon={ShoppingCart} label="Seferler" value={activeTrips.length} subtext={`${activeTrips.filter(t => t.status === "InTrip").length} devam ediyor`} color="bg-orange-600" />
        <StatCard icon={CreditCard} label="Sefer Geliri" value={`₺${totalTripFees.toLocaleString("tr-TR")}`} color="bg-teal-600" />
        <StatCard icon={CreditCard} label="Gider" value={`₺0`} color="bg-red-500" />
        <StatCard icon={ArrowLeftRight} label="Kiralamalar" value={rentals.length} subtext="aktif" color="bg-cyan-600" />
        <StatCard icon={AlertTriangle} label="Devre Dışı Araçlar" value={compVehicles.filter(v => !v.isActive && !activeTrips.some(t => t.vehiclePlate === v.plate)).length} color="bg-amber-600" />
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
              const tid = trip.id || trip.tripId;
              const endLoc = locations.find(l => l.id === trip.endLocationId);
              const currentPos = tripPositions[tid] || [startLoc.latitude, startLoc.longitude];
              const progress = tripProgress[tid] || 0;

              return (
                <Marker key={tid} position={currentPos as [number, number]} icon={truckDivIcon}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-bold border-b pb-1 mb-1">Araç: {trip.vehiclePlate}</div>
                      <strong>Nereden:</strong> {startLoc.locationName} <br/>
                      <strong>Nereye:</strong> {endLoc ? endLoc.locationName : "Bilinmiyor"} <br/>
                      <strong>Sürücü ID:</strong> {trip.driverId} <br/>
                      <div className="mt-2">
                        <strong>İlerleme:</strong> %{progress} tamamlandı
                        <div className="w-full bg-slate-200 h-2 rounded mt-1 overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-600 mt-2 block font-medium">Şu an Seferde (Canlı GPS)</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Seferler */}
        <div>
          <h3 className="mb-3">Son Seferler</h3>
          <div className="rounded-lg border border-border divide-y divide-border">
            {activeTrips.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Aktif sefer bulunamadı.</div>
            ) : (
              activeTrips.slice(-4).reverse().map(trip => {
                const startLoc = locations.find(l => l.id === trip.startLocationId);
                const endLoc = locations.find(l => l.id === trip.endLocationId);
                const statusLabel = trip.status === "InTrip" ? "Seferde" : trip.status === "Preparing" ? "Hazırlanıyor" : trip.status;
                const statusVariant = trip.status === "InTrip" ? "info" : trip.status === "Preparing" ? "warning" : "success";
                return (
                  <div key={trip.id} className="px-3 sm:px-4 py-3 bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">Sefer #{trip.id} — {trip.vehiclePlate}</p>
                        <p className="text-xs text-muted-foreground truncate">{startLoc?.locationName || "?"} → {endLoc?.locationName || "?"}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm">₺{(trip.totalFee || 0).toLocaleString("tr-TR")}</span>
                        <StatusBadge label={statusLabel} variant={statusVariant} />
                      </div>
                    </div>
                  </div>
                );
              })
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
              const status = isOnTrip ? "InTrip" : (d.driverTripStatus || "Idle");
              const isIdle = status === "Idle" || status === "Boşta" || status === "active";
              const isInactive = status === "Inactive" || status === "Pasif" || status === "inactive";
              
              const variant = isOnTrip ? "info" : isIdle ? "success" : "neutral";
              const label = isOnTrip ? "Seferde" : isIdle ? "Boşta" : "Pasif";
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