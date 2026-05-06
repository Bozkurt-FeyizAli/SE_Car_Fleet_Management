import React, { useState } from "react";
import {
  LayoutDashboard, Building2, Users, Truck, Car, ArrowLeftRight, Shield, Settings, ClipboardList, ChevronLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardTab } from "./tabs/DashboardTab";
import { CompaniesTab } from "./tabs/CompaniesTab";
import { UsersTab } from "./tabs/UsersTab";
import { DriversTab } from "./tabs/DriversTab";
import { VehiclesTab } from "./tabs/VehiclesTab";
import { RentalsTab } from "./tabs/RentalsTab";
import { AuditLogsTab } from "./tabs/AuditLogsTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { DepartmentsTab } from "../manager/tabs/DepartmentsTab";
import { PermissionsTab } from "./tabs/PermissionsTab";
import { ShieldAlert } from "lucide-react";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "companies", label: "Sirketler", icon: Building2 },
  { id: "departments", label: "Departmanlar", icon: Building2 },
  { id: "permissions", label: "Yetkiler", icon: ShieldAlert },
  { id: "users", label: "Kullanicilar", icon: Users },
  { id: "drivers", label: "Soforler", icon: Truck },
  { id: "vehicles", label: "Araclar", icon: Car },
  { id: "rentals", label: "Kiralik", icon: ArrowLeftRight },
  { id: "audit", label: "Denetim", icon: ClipboardList },
  { id: "settings", label: "Ayarlar", icon: Settings },
];

export function SystemAdminPanel() {
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
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary flex items-center justify-center shrink-0"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg truncate">Sistem Yonetimi</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Merkezi yonetim arayuzu</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">SA</div>
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
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
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
        {activeTab === "companies" && <CompaniesTab />}
        {activeTab === "departments" && <DepartmentsTab />}
        {activeTab === "permissions" && <PermissionsTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "drivers" && <DriversTab />}
        {activeTab === "vehicles" && <VehiclesTab />}
        {activeTab === "rentals" && <RentalsTab />}
        {activeTab === "audit" && <AuditLogsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
        <div className="flex overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[52px] flex flex-col items-center gap-0.5 px-1 py-2 transition-colors ${
                  activeTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${activeTab === tab.id ? "text-primary" : ""}`} />
                <span className="text-[9px] leading-tight text-center whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}export default SystemAdminPanel;