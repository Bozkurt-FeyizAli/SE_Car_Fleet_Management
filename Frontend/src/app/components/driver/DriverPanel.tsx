// PROJE_ANA_KLASOR/Frontend/src/app/components/driver/DriverPanel.tsx
import React, { useState, useEffect } from "react";
import {
  Building2, Car, MapPin, Users, Truck, Settings, AlertTriangle, Zap, User,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; 
import { ApiUser } from "../manager/tabs/DriversTab";

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
  { id: "quick", label: "Hızlı", icon: Zap },
  { id: "accident", label: "Kaza", icon: AlertTriangle },
  { id: "settings", label: "Ayarlar", icon: Settings },
];

export function DriverPanel() {
  const [activeTab, setActiveTab] = useState("profile");
  const [userData, setUserData] = useState<any>(null);
  const [fullUserRecord, setFullUserRecord] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async (email: string) => {
      try {
        const [usersRes, driversRes] = await Promise.all([
          fetch("/api/User"),
          fetch("/api/Drivers")
        ]);

        if (usersRes.ok && driversRes.ok) {
          const usersList: any[] = await usersRes.json();
          const driversList: any[] = await driversRes.json();

          const userMatch = usersList.find(u => u.email === email);
          if (userMatch) {
            const driverMatch = driversList.find(d => d.userId === userMatch.id);
            const merged = {
              ...userMatch,
              driverId: driverMatch?.id,
              driverLicenseId: driverMatch?.licenseNumber || userMatch.driverLicenseId,
              driverScore: driverMatch?.points ?? userMatch.driverScore,
              assignedVehiclePlate: driverMatch?.vehiclePlate || userMatch.assignedVehiclePlate,
              driverTripStatus: driverMatch?.status || userMatch.driverTripStatus,
              parentManagerId: userMatch.parentManagerId || userMatch.parentUserId
            };
            setFullUserRecord(merged);
          }
        }
      } catch (err) {
        console.error("Could not fetch full user details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);
      fetchData(parsedUser.email);

      // Anlık güncelleme için 15 saniyede bir yenile
      const interval = setInterval(() => fetchData(parsedUser.email), 15000);
      return () => clearInterval(interval);
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!userData || isLoading) {
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
            <p className="text-xs text-muted-foreground">{fullUserRecord?.firstName || userData.userName} &middot; {userData.email}</p>
          </div>
        </div>
        <button 
            onClick={() => { 
              localStorage.removeItem('token'); 
              localStorage.removeItem('user'); 
              navigate('/'); 
            }}
          className="text-xs bg-red-500/10 text-red-500 px-3 py-1.5 rounded-md hover:bg-red-500/20 transition-colors"
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
                  activeTab === tab.id ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground hover:text-emerald-500"
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
        {activeTab === "profile" && <ProfileTab user={fullUserRecord} />}
        {activeTab === "company" && <CompanyTab user={fullUserRecord} />}
        {activeTab === "vehicle" && <VehicleTab user={fullUserRecord} />}
        {activeTab === "trips" && <TripsTab />}
        {activeTab === "quick" && <QuickActionsTab />}
        {activeTab === "accident" && <AccidentReportTab user={fullUserRecord} />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

// routes.ts'deki lazy() fonksiyonu için varsayılan dışa aktarım zorunludur
export default DriverPanel;