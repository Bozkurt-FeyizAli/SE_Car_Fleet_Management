import React, { useState, useEffect } from "react";
import { Users, Truck, Car, ArrowLeftRight, ShoppingCart, CreditCard, TrendingUp, AlertTriangle } from "lucide-react";
import { StatCard } from "../../shared/StatCard";
import { StatusBadge } from "../../shared/StatusBadge";
import { currentCompany } from "../ManagerPanel";
import { interCompanyRentals, orders, payments, trips } from "../../../data/mockData";
import { ApiUser } from "./DriversTab";
import { ApiVehicle } from "./VehiclesTab";

export function DashboardTab() {
  const companyId = currentCompany.id;
  
  const [compDrivers, setCompDrivers] = useState<ApiUser[]>([]);
  const [compVehicles, setCompVehicles] = useState<ApiVehicle[]>([]);

  useEffect(() => {
    fetch("/api/User")
      .then(res => res.json())
      .then((data: ApiUser[]) => setCompDrivers(data.filter(u => u.roleId === 3 && u.email !== "admin@fleet.com")))
      .catch(e => console.error(e));

    fetch("/api/Vehicle")
      .then(res => res.json())
      .then((data: ApiVehicle[]) => setCompVehicles(data))
      .catch(e => console.error(e));
  }, []);

  const compRentals = interCompanyRentals.filter(r => r.owner_comp_id === companyId || r.renter_comp_id === companyId);
  const compOrders = orders.filter(o => o.company_id === companyId);
  const compPayments = payments.filter(p => p.company_id === companyId);
  const activeTrips = trips.filter(t => t.status === "in_progress" && compDrivers.some(d => d.id === t.driver_id));

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
        <StatCard icon={Truck} label="Şoförler" value={compDrivers.length} subtext={`${compDrivers.filter(d => d.driverTripStatus === "on_trip").length} seferde`} color="bg-emerald-600" />
        <StatCard icon={Car} label="Araçlar" value={compVehicles.length} subtext={`${compVehicles.filter(v => v.isActive).length} aktif`} color="bg-blue-600" />
        <StatCard icon={TrendingUp} label="Aktif Seferler" value={activeTrips.length} subtext={`Ort. puan: ${avgScore}`} color="bg-violet-600" />
        <StatCard icon={ShoppingCart} label="Siparişler" value={compOrders.length} subtext={`${compOrders.filter(o => o.status === "pending").length} beklemede`} color="bg-orange-600" />
        <StatCard icon={CreditCard} label="Gelir" value={`₺${totalIncome.toLocaleString("tr-TR")}`} color="bg-teal-600" />
        <StatCard icon={CreditCard} label="Gider" value={`₺${totalExpense.toLocaleString("tr-TR")}`} color="bg-red-500" />
        <StatCard icon={ArrowLeftRight} label="Kiralamalar" value={compRentals.filter(r => r.status === "active").length} subtext="aktif" color="bg-cyan-600" />
        <StatCard icon={AlertTriangle} label="Devre Dışı Araçlar" value={compVehicles.filter(v => !v.isActive).length} color="bg-amber-600" />
      </div>

      {/* Recent Orders */}
      <div>
        <h3 className="mb-3">Son Siparişler</h3>
        <div className="rounded-lg border border-border divide-y divide-border">
          {compOrders.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Bu şirkete ait sipariş bulunamadı.</div>
          ) : (
            compOrders.slice(-4).reverse().map(order => (
              <div key={order.id} className="px-3 sm:px-4 py-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {compDrivers.map(d => {
            const score = d.driverScore ?? 0;
            const status = d.driverTripStatus || "inactive";
            const variant = status === "active" ? "success" : status === "on_trip" ? "info" : "neutral";
            const label = status === "active" ? "Aktif" : status === "on_trip" ? "Seferde" : "Pasif";
            return (
              <div key={d.id} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                <div>
                  <p className="text-sm">{d.firstName} {d.lastName}</p>
                  <StatusBadge label={label} variant={variant} />
                </div>
                <div className={`text-xl ${score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600"}`}>
                  {score}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}