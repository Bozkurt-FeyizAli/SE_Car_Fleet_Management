import React, { useState, useEffect } from "react";
import { Building2, Users, Truck, Car, ArrowLeftRight, AlertTriangle, TrendingUp, ClipboardList, MapPin } from "lucide-react";
import { StatCard } from "../../shared/StatCard";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { interCompanyRentals, auditLogs, trips, accidentReports } from "../../../data/mockData";
import { Company } from "./CompaniesTab";
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

// Sistem Yöneticisi için Mavi pin Icon
const adminTruckIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: "hue-rotate-[240deg]", // Mavi/Lacivert tonlarında bir pin
});

export function DashboardTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [globalTrips, setGlobalTrips] = useState<any[]>([]);
  const [globalLocations, setGlobalLocations] = useState<any[]>([]);

  useEffect(() => {
    // 1. Önce firmaları çekiyoruz
    fetch("/api/v1/companies")
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
              tArr.forEach(t => allTrips.push({ ...t, assignedCompanyName: comps[i].name }));
            }
          });

          const allLocs: any[] = [];
          locsResults.forEach(lArr => {
            if (Array.isArray(lArr)) {
              allLocs.push(...lArr);
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

    fetch("/api/User")
      .then(res => res.ok ? res.json() : [])
      .then(setUsers)
      .catch(console.error);

    fetch("/api/v1/vehicles")
      .then(res => res.ok ? res.json() : [])
      .then(setVehicles)
      .catch(console.error);
  }, []);

  const activeCompanies = companies.filter(c => c.status === "active").length;
  const drivers = users.filter(u => u.roleId === 3 && u.email !== "admin@fleet.com");
  const activeDrivers = drivers.filter(d => d.driverTripStatus !== "inactive").length;
  const activeVehicles = vehicles.filter(v => v.isActive).length;
  const activeRentals = interCompanyRentals.filter(r => r.status === "active").length;
  
  // Devam eden global gerçek sefer sayısını buradan da sayabiliriz (mock + globalTrips)
  const ongoingTrips = globalTrips.length > 0 ? globalTrips.length : trips.filter(t => t.status === "in_progress").length;
  
  const openAccidents = accidentReports.filter(a => a.status !== "resolved").length;
  
  const totalScore = drivers.reduce((s, d) => s + (d.driverScore || 0), 0);
  const avgScore = drivers.length > 0 ? (totalScore / drivers.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <h2>Sistem Genel Bakis</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Aktif Sirketler" value={activeCompanies} subtext={`${companies.length} toplam`} color="bg-blue-600" />
        <StatCard icon={Users} label="Toplam Kullanicilar" value={users.length} subtext={`${users.filter(u => u.roleId === 3).length} sofor`} color="bg-violet-600" />
        <StatCard icon={Truck} label="Aktif Soforler" value={activeDrivers} subtext={`Ort. puan: ${avgScore}`} color="bg-emerald-600" />
        <StatCard icon={Car} label="Aktif Araclar" value={activeVehicles} subtext={`${vehicles.length} toplam`} color="bg-orange-600" />
        <StatCard icon={ArrowLeftRight} label="Aktif Kiralamalar" value={activeRentals} color="bg-cyan-600" />
        <StatCard icon={TrendingUp} label="Devam Eden Seferler" value={ongoingTrips} color="bg-indigo-600" />
        <StatCard icon={AlertTriangle} label="Acik Kaza Bildirimi" value={openAccidents} color="bg-red-600" />
        <StatCard icon={ClipboardList} label="Denetim Kayitlari" value={auditLogs.length} color="bg-gray-600" />
      </div>

      {/* GLOBAL KÜRESEL HARİTA */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-indigo-500"><MapPin className="w-5 h-5"/> Küresel Canlı Harita (Tüm Şirketler)</h3>
        <p className="text-sm text-muted-foreground mb-3">Sistemdeki tüm şirketlerin şu an taşıma onayı verdiği veya hareket halindeki araçların global dağılımı:</p>
        
        <div className="h-[450px] w-full rounded-xl border border-border shadow-md overflow-hidden relative z-0 bg-slate-900/50">
          <MapContainer center={[39.0, 35.0]} zoom={6} style={{ height: "100%", width: "100%", zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {globalTrips.map(trip => {
              const startLoc = globalLocations.find(l => l.id === trip.startLocationId);
              if (!startLoc) return null;
              return { trip, startLoc };
            }).filter(Boolean).map(({ trip, startLoc }: any) => {
              const endLoc = globalLocations.find(l => l.id === trip.endLocationId);
              return (
                <Marker key={trip.id || trip.tripId} position={[startLoc.latitude, startLoc.longitude]} icon={adminTruckIcon}>
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
                      <span className="text-xs text-blue-600 mt-2 font-medium flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Sefer Devam Ediyor
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
                  <p className="text-sm font-semibold truncate text-indigo-400">{c.name}</p>
                  <StatusBadge label={getStatusLabel(c.status)} variant={getStatusVariant(c.status)} />
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Mevcut Şoför:</span>
                    <span className="font-medium text-foreground">{drivers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mevcut Araç:</span>
                    <span className="font-medium text-foreground">{vehicles.length}</span>
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