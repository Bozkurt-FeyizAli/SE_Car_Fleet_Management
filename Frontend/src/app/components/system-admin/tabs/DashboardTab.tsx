import React, { useState, useEffect } from "react";
import { Building2, Users, Truck, Car, ArrowLeftRight, AlertTriangle, TrendingUp, ClipboardList } from "lucide-react";
import { StatCard } from "../../shared/StatCard";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { interCompanyRentals, auditLogs, trips, accidentReports } from "../../../data/mockData";
import { Company } from "./CompaniesTab";
import { ApiUser } from "./DriversTab";
import { ApiVehicle } from "./VehiclesTab";

export function DashboardTab() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);

  useEffect(() => {
    fetch("/api/v1/companies")
      .then(res => {
        if (!res.ok) throw new Error("Companies API not found");
        return res.json();
      })
      .then(setCompanies)
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
  const ongoingTrips = trips.filter(t => t.status === "in_progress").length;
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

      {/* Recent Audit Logs */}
      <div className="mt-6">
        <h3 className="mb-3">Son Denetim Kayitlari</h3>
        <div className="rounded-lg border border-border divide-y divide-border">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {companies.map(c => (
            <div key={c.id} className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm truncate">{c.name}</p>
                <StatusBadge label={getStatusLabel(c.status)} variant={getStatusVariant(c.status)} />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{drivers.length} toplam sofor</span>
                <span>{vehicles.length} toplam arac</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}