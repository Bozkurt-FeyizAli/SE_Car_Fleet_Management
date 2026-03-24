import React, { useState } from "react";
import {
  LayoutDashboard, Users, Truck, Car, ArrowLeftRight, UserCog, Settings, ShoppingCart, CreditCard, FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardTab } from "./tabs/DashboardTab";
import { UsersTab } from "./tabs/UsersTab";
import { DriversTab } from "./tabs/DriversTab";
import { VehiclesTab } from "./tabs/VehiclesTab";
import { RentalsTab } from "./tabs/RentalsTab";
import { OrdersTab } from "./tabs/OrdersTab";
import { PaymentsTab } from "./tabs/PaymentsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { companies, users } from "../../data/mockData";

// Simulated logged-in company admin
export const CURRENT_COMPANY_ADMIN_ID = 2;
export const currentCompanyAdmin = users.find(u => u.id === CURRENT_COMPANY_ADMIN_ID)!;
export const currentCompany = companies.find(c => c.id === currentCompanyAdmin.company_id)!;

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Yoneticiler", icon: UserCog },
  { id: "drivers", label: "Soforler", icon: Truck },
  { id: "vehicles", label: "Araclar", icon: Car },
  { id: "rentals", label: "Kiralik", icon: ArrowLeftRight },
  { id: "orders", label: "Siparisler", icon: ShoppingCart },
  { id: "payments", label: "Odemeler", icon: CreditCard },
  { id: "documents", label: "Belgeler", icon: FileText },
  { id: "settings", label: "Ayarlar", icon: Settings },
];

export function ManagerPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0"
            >
              <UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg truncate">Yonetici Paneli</h1>
              <p className="text-xs text-muted-foreground hidden sm:block truncate">
                {currentCompanyAdmin.full_name} &middot; {currentCompany.name}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-sm shrink-0">
            {currentCompanyAdmin.full_name.split(" ").map(n => n[0]).join("")}
          </div>
        </div>
      </header>

      {/* Desktop Tab Navigation */}
      <div className="border-b border-border bg-card hidden sm:block">
        <div className="flex overflow-x-auto px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm ${
                  activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-6 pb-20 sm:pb-6">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "drivers" && <DriversTab />}
        {activeTab === "vehicles" && <VehiclesTab />}
        {activeTab === "rentals" && <RentalsTab />}
        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "payments" && <PaymentsTab />}
        {activeTab === "documents" && <DocumentsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[48px] flex flex-col items-center gap-0.5 px-1 py-2 transition-colors ${
                  activeTab === tab.id ? "text-blue-600" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] leading-tight text-center whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}export default ManagerPanel;