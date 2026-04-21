import React, { useState, useEffect } from "react";
import { Building2, Users, Truck, Car, ArrowLeftRight, AlertTriangle, TrendingUp, ClipboardList, MapPin } from "lucide-react";
import { StatCard } from "../../shared/StatCard";
import { StatusBadge, getStatusVariant } from "../../shared/StatusBadge";
import { auditLogs, accidentReports } from "../../../data/mockData";
import { Company } from "./CompaniesTab";
import * as signalR from "@microsoft/signalr";
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

// Sistem Yöneticisi için İkon
const adminTruckDivIcon = new L.DivIcon({
  html: `<div style="font-size: 24px; background: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid #6366f1; transform: scaleX(-1);">🚚</div>`,
  className: "custom-truck-icon bg-transparent border-none",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export function DashboardTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [globalTrips, setGlobalTrips] = useState<any[]>([]);
  const [globalLocations, setGlobalLocations] = useState<any[]>([]);
  const [activeRentalsCount, setActiveRentalsCount] = useState<number>(0);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "all">("all");

  // Canlı Simülasyon State'leri
  const [globalTripRoutes, setGlobalTripRoutes] = useState<Record<number, [number, number][]>>({});
  const [globalTripPositions, setGlobalTripPositions] = useState<Record<number, [number, number]>>({});
  const [globalTripProgress, setGlobalTripProgress] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchData = () => {
      // 1. Önce firmaları çekiyoruz
      fetch("/api/v1/companies", { cache: "no-store" })
        .then(res => {
          if (!res.ok) throw new Error("Companies API not found");
          return res.json();
        })
        .then(async (comps: Company[]) => {
          setCompanies(comps);
          
          // 2. Firmalar geldikten sonra, HER BİR firma için aktif seferleri ve lokasyonları çekiyoruz
          try {
            const tripPromises = comps.map(c => apiFetch(`/Trips/active/${c.id}`).catch(() => []));
            const locPromises = comps.map(c => apiFetch(`/Locations/company/${c.id}`).catch(() => []));
            
            const tripsResults = await Promise.all(tripPromises);
            const locsResults = await Promise.all(locPromises);
            
            // Gelen sonuçları tek bir dev dizi halinde birleştir (flat)
            // Ayrıca hangi firmanın seferi olduğunu anlamak için sefer objesine companyName ekleyelim
            const allTrips: any[] = [];
            tripsResults.forEach((tArr, i) => {
              if (Array.isArray(tArr)) {
                tArr.forEach(t => allTrips.push({ ...t, companyId: comps[i].id, assignedCompanyName: comps[i].companyName }));
              }
            });

            const allLocs: any[] = [];
            locsResults.forEach((lArr, i) => {
              if (Array.isArray(lArr)) {
                lArr.forEach(l => allLocs.push({ ...l, companyId: comps[i].id, companyName: comps[i].companyName }));
              }
            });

            setGlobalTrips(allTrips);
            setGlobalLocations(allLocs);
          } catch(e) {
            console.error("Global harita verileri çekilirken hata:", e);
          }
        })
        .catch(() => {
          // Backend'de Company tablosu henüz yoksa veya 404 verirse mock datayı yükle
          import("../../../data/mockData").then(m => setCompanies(m.companies as unknown as Company[]));
        });

      fetch("/api/User", { cache: "no-store" })
        .then(res => res.ok ? res.json() : [])
        .then(setUsers)
        .catch(console.error);

      fetch("/api/v1/vehicles", { cache: "no-store" })
        .then(res => res.ok ? res.json() : [])
        .then(setVehicles)
        .catch(console.error);

      fetch("/api/v1/rentals/all", { cache: "no-store" })
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const liveRentals = Array.isArray(data) ? data : (data?.data || []);
          const activeCount = liveRentals.filter((r: any) => !r.returnDate).length;
          setActiveRentalsCount(activeCount);
        })
        .catch(console.error);
    };

    fetchData(); // first fetch
    
    // YENİ: SignalR ile WebSocket üzerinden anlık güncelleme bağlantısı
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://mikbalceyhan.me/fleetHub")
      .withAutomaticReconnect()
      .build();

    connection.start().catch((err: any) => console.error("SignalR Connection Error:", err));

    // Backend'in fırlattığı eventlar
    connection.on("ReceiveUpdate", fetchData);
    connection.on("UpdateVehicleStatus", fetchData);

    return () => {
      connection.stop();
    };
  }, []);

  // OSRM Rota Çekme ve Animasyon Loop
  useEffect(() => {
    if (globalTrips.length === 0 || globalLocations.length === 0) return;

    const fetchRoute = async (tripId: number, start: any, end: any) => {
      if (globalTripRoutes[tripId]) return;
      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setGlobalTripRoutes(prev => ({...prev, [tripId]: coords}));
        }
      } catch (e) {
        console.error("OSRM Fetch Error:", e);
      }
    };

    globalTrips.forEach(trip => {
      const tid = trip.id || trip.tripId;
      const startLoc = globalLocations.find(l => l.id === trip.startLocationId);
      const endLoc = globalLocations.find(l => l.id === trip.endLocationId);
      if (startLoc && endLoc && !globalTripRoutes[tid]) {
        fetchRoute(tid, startLoc, endLoc);
      }
    });
  }, [globalTrips, globalLocations, globalTripRoutes]);

  // Canlı Animasyon Loop - Her 2 saniyede bir
  useEffect(() => {
    if (globalTrips.length === 0) return;

    const interval = setInterval(() => {
      const newPositions: Record<number, [number, number]> = {};
      const newProgress: Record<number, number> = {};

      globalTrips.forEach(trip => {
        const tid = trip.id || trip.tripId;
        const coords = globalTripRoutes[tid];
        const startLoc = globalLocations.find(l => l.id === trip.startLocationId);
        
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

      setGlobalTripPositions(prev => ({...prev, ...newPositions}));
      setGlobalTripProgress(prev => ({...prev, ...newProgress}));
    }, 2000);

    return () => clearInterval(interval);
  }, [globalTrips, globalTripRoutes, globalLocations]);

  const activeCompanies = companies.length;
  const drivers = users.filter(u => {
    const rid = u.roleId !== undefined && u.roleId !== null ? u.roleId : (u as any).role;
    return rid === 2 && u.email !== "admin@fleet.com";
  });
  const activeDrivers = drivers.filter(d => d.driverTripStatus !== "inactive" && d.driverTripStatus !== "Pasif").length;
  const activeVehicles = vehicles.filter(v => v.isActive || globalTrips.some(t => t.vehiclePlate === v.plate)).length;
  
  // Devam eden global gerçek sefer sayısı
  const ongoingTrips = globalTrips.length;
  
  const openAccidents = accidentReports.filter(a => a.status !== "resolved").length;
  
  const totalScore = drivers.reduce((s, d) => s + (d.driverScore || 0), 0);
  const avgScore = drivers.length > 0 ? (totalScore / drivers.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <h2>Sistem Genel Bakis</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Aktif Sirketler" value={activeCompanies} subtext={`${companies.length} toplam`} color="bg-blue-600" />
        <StatCard icon={Users} label="Toplam Kullanicilar" value={users.length} subtext={`${users.filter(u => {
          const rid = u.roleId !== undefined && u.roleId !== null ? u.roleId : (u as any).role;
          return rid === 2;
        }).length} sofor`} color="bg-violet-600" />
        <StatCard icon={Truck} label="Aktif Soforler" value={activeDrivers} subtext={`Ort. puan: ${avgScore}`} color="bg-emerald-600" />
        <StatCard icon={Car} label="Aktif Araclar" value={activeVehicles} subtext={`${vehicles.length} toplam`} color="bg-orange-600" />
        <StatCard icon={ArrowLeftRight} label="Aktif Kiralamalar" value={activeRentalsCount} color="bg-cyan-600" />
        <StatCard icon={TrendingUp} label="Devam Eden Seferler" value={ongoingTrips} color="bg-indigo-600" />
        <StatCard icon={AlertTriangle} label="Acik Kaza Bildirimi" value={openAccidents} color="bg-red-600" />
        <StatCard icon={ClipboardList} label="Denetim Kayitlari" value={auditLogs.length} color="bg-gray-600" />
      </div>

      {/* GLOBAL KÜRESEL HARİTA */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-3 text-indigo-500 gap-4">
          <h3 className="flex items-center gap-2">
            <MapPin className="w-5 h-5"/> 
            Küresel Canlı Harita {selectedCompanyId === "all" ? "(Tüm Şirketler)" : `(${companies.find(c => c.id === selectedCompanyId)?.companyName || ""})`}
          </h3>
          <select 
            className="h-9 rounded-md border border-indigo-400 bg-card text-indigo-400 font-medium px-3 text-sm focus:outline-none"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">Tüm Şirketler</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Sistemdeki seçili şirketlerin operasyon konumları (Mavi pin) ve hareket halindeki araçları (Lacivert araç pini):</p>
        
        <div className="h-[450px] w-full rounded-xl border border-border shadow-md overflow-hidden relative z-0 bg-slate-900/50">
          <MapContainer center={[39.0, 35.0]} zoom={6} style={{ height: "100%", width: "100%", zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {globalLocations
              .filter(l => selectedCompanyId === "all" || l.companyId === selectedCompanyId)
              .map((loc: any) => (
                <Marker key={`loc-${loc.id || loc.locationName}`} position={[loc.latitude, loc.longitude]}>
                  <Popup>
                    <div className="text-sm p-1">
                      <span className="font-bold text-xs bg-slate-100 text-slate-800 p-1 border rounded block mb-1">🏢 {loc.companyName}</span>
                      <strong>Konum:</strong> {loc.locationName}<br/>
                      <strong>Adres:</strong> {loc.address?.fullAddress || loc.fullAddress || loc.address?.city}
                    </div>
                  </Popup>
                </Marker>
            ))}
            {globalTrips
              .filter(t => selectedCompanyId === "all" || t.companyId === selectedCompanyId)
              .map(trip => {
              const startLoc = globalLocations.find(l => l.id === trip.startLocationId);
              if (!startLoc) return null;
              return { trip, startLoc };
            }).filter(Boolean).map(({ trip, startLoc }: any) => {
              const tid = trip.id || trip.tripId;
              const endLoc = globalLocations.find(l => l.id === trip.endLocationId);
              const currentPos = globalTripPositions[tid] || [startLoc.latitude, startLoc.longitude];
              const progress = globalTripProgress[tid] || 0;

              return (
                <Marker key={tid} position={currentPos as [number, number]} icon={adminTruckDivIcon}>
                  <Popup>
                    <div className="text-sm p-1">
                      <div className="bg-indigo-100 text-indigo-900 font-bold px-2 py-1 rounded inline-block mb-2 text-xs border border-indigo-200">
                        🏢 {trip.assignedCompanyName}
                      </div>
                      <br/>
                      <strong>Araç Plaka:</strong> {trip.vehiclePlate} <br/>
                      <strong>Sürücü ID:</strong> {trip.driverId} <br/>
                      <strong>Çıkış:</strong> {startLoc.locationName} <br/>
                      <strong>Varış:</strong> {endLoc ? endLoc.locationName : "Bilinmiyor"} <br/>
                      
                      <div className="mt-2">
                        <strong>İlerleme:</strong> %{progress} tamamlandı
                        <div className="w-full bg-slate-200 h-2 rounded mt-1 overflow-hidden">
                          <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>

                      <span className="text-xs text-blue-600 mt-2 font-medium flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Canlı GPS Sensörü Devrede
                      </span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Audit Logs */}
        <div>
          <h3 className="mb-3">Son Denetim Kayitlari</h3>
          <div className="rounded-lg border border-border divide-y divide-border bg-card">
            {auditLogs.slice(-5).reverse().map(log => (
              <div key={log.id} className="flex items-start gap-3 px-3 sm:px-4 py-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{log.description}</p>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString("tr-TR")}</span>
                    <StatusBadge label={log.action_type.replace(/_/g, " ")} variant={getStatusVariant(log.action_type.includes("accident") ? "major" : "active")} />
                    <span className="text-xs text-muted-foreground">{log.user_id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Companies Overview */}
        <div>
          <h3 className="mb-3">Sirket Durumu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {companies.map(c => (
              <div key={c.id} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold truncate text-indigo-400">{c.companyName}</p>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Mevcut Şoför:</span>
                    <span className="font-medium text-foreground">{drivers.filter(d => d.companyId === c.id).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mevcut Araç:</span>
                    <span className="font-medium text-foreground">{vehicles.filter(v => v.companyId === c.id).length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}