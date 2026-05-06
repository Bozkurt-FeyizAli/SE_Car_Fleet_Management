import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Truck, Car, ArrowLeftRight, UserCog, Settings, ShoppingCart, CreditCard, FileText, Map, Building2
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
import { LocationsTab } from "./tabs/LocationsTab";
import { DepartmentsTab } from "./tabs/DepartmentsTab";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "locations", label: "Konumlar", icon: Map },
  { id: "departments", label: "Departmanlar", icon: Building2 },
  { id: "users", label: "Yoneticiler", icon: UserCog },
  { id: "drivers", label: "Soforler", icon: Truck },
  { id: "vehicles", label: "Araclar", icon: Car },
  { id: "rentals", label: "Kiralik", icon: ArrowLeftRight },
  { id: "orders", label: "Seferler", icon: ShoppingCart },

  { id: "settings", label: "Ayarlar", icon: Settings },
];

import { apiFetch } from "../../utils/api";

// Dynamic Proxy equivalents to prevent White Screen crash in 9 Tabs
export const currentCompanyAdmin = {
  get id() { return Number(localStorage.getItem("managerUserId")) || 1; },
  get full_name() { return localStorage.getItem("managerUserName") || "Yönetici"; },
  get company_id() { return Number(localStorage.getItem("managerCompanyId")) || 1; }
};

export const currentCompany = {
  get id() { return Number(localStorage.getItem("managerCompanyId")) || 1; },
  get name() { return localStorage.getItem("managerCompanyName") || "Şirket Yükleniyor..."; },
  get address() { return ""; },
  get phone() { return ""; }
};

export function ManagerPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<number>(1);
  const navigate = useNavigate();

  // Dynamic User and Company State
  const [adminName, setAdminName] = useState("Yükleniyor...");
  const [companyName, setCompanyName] = useState("Şirket Bilgisi...");
  const [adminInitials, setAdminInitials] = useState("?");

  useEffect(() => {
    // Determine user identity from token
    const token = localStorage.getItem("token");
    let userEmail = "";
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        // Extract email from standard JWT claims
        userEmail = decoded.email || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || decoded.unique_name || "";

        // Extract role
        const roleClaim = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (roleClaim !== undefined) {
          setUserRole(Number(roleClaim));
        }
      } catch (e) { console.error("Token parse error", e); }
    }

    const loadProfile = async () => {
      try {
        let matchedUser = null;
        if (userEmail) {
          // Fetch all users to find this user
          const usersRes = await fetch("/api/User");
          if (usersRes.ok) {
            const users = await usersRes.json();
            matchedUser = users.find((u: any) => u.email === userEmail);
          }
        }

        if (matchedUser) {
          const fullName = `${matchedUser.firstName || ''} ${matchedUser.lastName || ''}`.trim() || 'Adsız Yönetici';
          setAdminName(fullName);
          setAdminInitials(fullName.substring(0, 2).toUpperCase());

          localStorage.setItem("managerUserId", String(matchedUser.id || 1));
          localStorage.setItem("managerUserName", fullName);

          const cId = matchedUser.companyId;
          if (cId) {
            localStorage.setItem("managerCompanyId", String(cId));
            const compRes = await fetch("/api/v1/companies");
            if (compRes.ok) {
              const companies = await compRes.json();
              const myComp = companies.find((c: any) => c.id === cId);
              if (myComp) {
                const cName = myComp.companyName || myComp.name || "İsimsiz Şirket";
                setCompanyName(cName);
                localStorage.setItem("managerCompanyName", cName);
              } else {
                setCompanyName("Şirket Bulunamadı");
              }
            }
          }
        } else {
          // Fallback if no network
          setAdminName("Şirket Yöneticisi");
          setCompanyName("Bilginiz Yüklenemedi");
          setAdminInitials("ŞY");
        }
      } catch (err) {
        console.error("Profil yüklenirken hata", err);
      }
    };

    loadProfile();

    // Load permissions and user role
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const managerId = user?.id || 1; // fallback
    if (user && user.role !== undefined) setUserRole(user.role);

    apiFetch(`/v1/managers/${managerId}/permissions`)
      .then(res => {
        const perms: string[] = Array.isArray(res) ? res : res?.permissions || res?.data || [];
        setPermissions(perms);
        localStorage.setItem('managerPermissions', JSON.stringify(perms));
      })
      .catch(() => { });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate("/")}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-700 transition"
              title="Ana Sayfaya Dön"
            >
              <UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg truncate font-semibold text-foreground">Yönetici Paneli</h1>
              <p className="text-xs text-muted-foreground hidden sm:block truncate">
                {adminName} <span className="mx-1 text-slate-500">&bull;</span> <span className="text-indigo-400 font-medium">{companyName}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{adminName}</p>
              <p className="text-xs text-muted-foreground">{companyName}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 text-blue-800 flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
              {adminInitials}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Tab Navigation */}
      <div className="border-b border-border bg-card hidden sm:block">
        <div className="flex overflow-x-auto px-6">
          {tabs.map((tab) => {
            if (tab.id === "departments" && userRole !== 0) return null;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm font-medium ${activeTab === tab.id ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50"
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
        {activeTab === "locations" && <LocationsTab />}
        {activeTab === "departments" && <DepartmentsTab />}
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
            if (tab.id === "departments" && userRole !== 0) return null;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[48px] flex flex-col items-center gap-0.5 px-1 py-2 transition-colors ${activeTab === tab.id ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] leading-tight text-center whitespace-nowrap font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ManagerPanel;