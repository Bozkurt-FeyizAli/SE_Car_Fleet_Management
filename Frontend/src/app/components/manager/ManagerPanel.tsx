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

// Maps a permission name to tab IDs using keyword matching (case-insensitive)
function getTabsForPermission(permName: string): string[] {
  const lower = permName.toLowerCase();
  const tabs: string[] = [];
  if (lower.includes("kullanıcı") || lower.includes("kullanici")) {
    tabs.push("users", "drivers");
  }
  if (lower.includes("araç") || lower.includes("arac")) {
    // "Araç Kiralama" should map to rentals, "Araç İşlemleri" to vehicles
    if (lower.includes("kiralama")) {
      tabs.push("rentals");
    } else {
      tabs.push("vehicles");
    }
  }
  if (lower.includes("kiralama") && !lower.includes("araç") && !lower.includes("arac")) {
    tabs.push("rentals");
  }
  if (lower.includes("şoför") || lower.includes("sofor")) {
    tabs.push("drivers");
  }
  if (lower.includes("departman")) {
    tabs.push("departments");
  }
  if (lower.includes("sefer") || lower.includes("order")) {
    tabs.push("orders");
  }
  if (lower.includes("konum") || lower.includes("lokasyon") || lower.includes("location")) {
    tabs.push("locations");
  }
  return tabs;
}

// Determines whether a tab should be visible based on department and permissions
function isTabVisible(
  tabId: string,
  isGenel: boolean,
  permissions: string[],
  userRole: number
): boolean {
  // These tabs are always visible for everyone
  if (tabId === "dashboard" || tabId === "settings") return true;

  // "Genel" department = no restriction at all
  if (isGenel) return true;

  // Restricted departments: build allowed tab list from permissions
  const allowedTabs = new Set<string>(["dashboard", "settings"]);
  for (const permName of permissions) {
    const mapped = getTabsForPermission(permName);
    mapped.forEach((t) => allowedTabs.add(t));
  }
  // Departments tab additionally requires role=0
  if (tabId === "departments") return allowedTabs.has("departments") && userRole === 0;
  return allowedTabs.has(tabId);
}

export function ManagerPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<number>(1);
  const [departmentName, setDepartmentName] = useState<string>("");
  const [isGenel, setIsGenel] = useState<boolean>(false);
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

    // Load manager info, permissions and user role
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    if (user && user.role !== undefined) setUserRole(user.role);

    const loadManagerData = async () => {
      try {
        // Get all managers
        const allManagers = await apiFetch('/v1/managers');
        const managers: any[] = Array.isArray(allManagers) ? allManagers : [];

        // Strategy 1: Try matching by userId from localStorage
        const storedUserId = user?.id || Number(localStorage.getItem('managerUserId')) || 0;
        let myManager = managers.find((m: any) => Number(m.userId) === Number(storedUserId));

        // Strategy 2: If not found, match by email through User API
        if (!myManager) {
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
              userEmail = decoded.email || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || decoded.unique_name || "";
            } catch (e) { }
          }

          if (userEmail) {
            try {
              const usersRes = await fetch("/api/User");
              if (usersRes.ok) {
                const allUsers = await usersRes.json();
                const matchedUser = allUsers.find((u: any) => u.email === userEmail);
                if (matchedUser) {
                  myManager = managers.find((m: any) => Number(m.userId) === Number(matchedUser.id));
                  console.log('[ManagerPanel] Email match: email=', userEmail, 'matchedUserId=', matchedUser.id);
                }
              }
            } catch (e) { }
          }
        }

        console.log('[ManagerPanel] storedUserId:', storedUserId, '| managers:', managers.map((m: any) => ({id: m.id, userId: m.userId, dept: m.departmentName})), '| myManager:', myManager);

        if (myManager) {
          const deptName: string = myManager.departmentName || '';
          setDepartmentName(deptName);
          const genel = deptName.toLowerCase().includes('genel');
          setIsGenel(genel);
          localStorage.setItem('managerDepartmentName', deptName);
          localStorage.setItem('managerIsGenel', genel ? '1' : '0');

          // Fetch this manager's permissions using ManagerPermission + Permission APIs
          // (bypasses broken /managers/{id}/permissions endpoint)
          const [mpRes, permRes] = await Promise.all([
            fetch(`/api/ManagerPermission`),
            fetch(`/api/Permission`)
          ]);
          let perms: string[] = [];
          if (mpRes.ok && permRes.ok) {
            const mpList = await mpRes.json();
            const permList = await permRes.json();
            // Filter manager permissions by this manager's ID
            const myPermIds: number[] = (Array.isArray(mpList) ? mpList : [])
              .filter((mp: any) => Number(mp.managerId || mp.ManagerId) === Number(myManager.id))
              .map((mp: any) => mp.permissionId || mp.PermissionId);
            // Map permission IDs to names
            perms = (Array.isArray(permList) ? permList : [])
              .filter((p: any) => myPermIds.includes(p.id))
              .map((p: any) => p.name || '');
          }
          console.log('[ManagerPanel] dept:', deptName, '| isGenel:', genel, '| perms:', perms);
          setPermissions(perms.filter(Boolean));
          localStorage.setItem('managerPermissions', JSON.stringify(perms.filter(Boolean)));
        } else {
          console.warn('[ManagerPanel] Manager bulunamadı! storedUserId:', storedUserId);
          // Fallback: try localStorage
          const cached = localStorage.getItem('managerPermissions');
          if (cached) setPermissions(JSON.parse(cached));
          const cachedDept = localStorage.getItem('managerDepartmentName') || '';
          setDepartmentName(cachedDept);
          setIsGenel(cachedDept.toLowerCase().includes('genel'));
        }
      } catch (e) {
        console.error('Manager data yüklenemedi', e);
        const cached = localStorage.getItem('managerPermissions');
        if (cached) setPermissions(JSON.parse(cached));
      }
    };

    // Run loadManagerData after loadProfile so managerUserId is in localStorage
    loadProfile().then(() => loadManagerData());
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
            if (!isTabVisible(tab.id, isGenel, permissions, userRole)) return null;
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
            if (!isTabVisible(tab.id, isGenel, permissions, userRole)) return null;
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