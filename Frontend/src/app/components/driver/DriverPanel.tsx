// PROJE_ANA_KLASOR/Frontend/src/app/components/driver/DriverPanel.tsx
import React, { useState, useEffect } from "react";
import {
  Building2, Car, MapPin, Users, Truck, Settings, AlertTriangle, Zap, User,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // react-router-dom'dan geldiğinden emin ol

// Alt sekmelerin (ProfileTab, VehicleTab vb.) beklediği exportlar
import { drivers, companies } from "../../data/mockData";
export const CURRENT_DRIVER_ID = 1;
export const currentDriver = drivers.find(d => d.id === CURRENT_DRIVER_ID) || drivers[0];
export const driverCompany = companies.find(c => c.id === currentDriver.company_id) || companies[0];

// Tab bileşenlerini içe aktarırken yolların doğruluğunu kontrol et
import { ProfileTab } from "./tabs/ProfileTab";
import { CompanyTab } from "./tabs/CompanyTab";
import { VehicleTab } from "./tabs/VehicleTab";
import { TripsTab } from "./tabs/TripsTab";
import { DepartmentTab } from "./tabs/DepartmentTab";
import { AccidentReportTab } from "./tabs/AccidentReportTab";
import { QuickActionsTab } from "./tabs/QuickActionsTab";
import { SettingsTab } from "./tabs/SettingsTab";

const tabs = [
  { id: "profile", label: "Profilim", icon: User },
  { id: "company", label: "Şirket", icon: Building2 },
  { id: "vehicle", label: "Araç", icon: Car },
  { id: "trips", label: "Seferler", icon: MapPin },
  { id: "department", label: "Departman", icon: Users },
  { id: "quick", label: "Hızlı", icon: Zap },
  { id: "accident", label: "Kaza", icon: AlertTriangle },
  { id: "settings", label: "Ayarlar", icon: Settings },
];

export function DriverPanel() {
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Giriş verilerini al
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!userData) {
    return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-40 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Şoför Paneli</h1>
            <p className="text-xs text-muted-foreground">{userData.userName} &middot; {userData.email}</p>
          </div>
        </div>
        <button 
          onClick={() => { localStorage.clear(); navigate('/'); }}
          className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-md hover:bg-red-500/20"
        >
          Çıkış Yap
        </button>
      </header>

      <div className="border-b border-border bg-card hidden sm:block">
        <div className="flex overflow-x-auto px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm transition-all ${
                  activeTab === tab.id ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="p-4 sm:p-8">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "company" && <CompanyTab />}
        {activeTab === "vehicle" && <VehicleTab />}
        {activeTab === "trips" && <TripsTab />}
        {activeTab === "department" && <DepartmentTab />}
        {activeTab === "quick" && <QuickActionsTab />}
        {activeTab === "accident" && <AccidentReportTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

// routes.ts'deki lazy() fonksiyonu için varsayılan dışa aktarım zorunludur
export default DriverPanel;