import React from "react";
import { useNavigate } from "react-router";
import { Shield, UserCog, Truck } from "lucide-react";

const roles = [
  {
    id: "system-admin",
    title: "Sistem Yoneticisi",
    description: "Tum sirketleri, kullanicilari, soforleri, araclari yonetin. Dashboard, denetim kayitlari ve sistem ayarlari.",
    icon: Shield,
    color: "bg-primary",
    hoverColor: "hover:border-primary/40 hover:shadow-lg",
    path: "/system-admin",
  },
  {
    id: "manager",
    title: "Sirket Yoneticisi",
    description: "Sirketinizin yoneticileri, soforler, araclar, siparisler, odemeler ve belgelerini yonetin.",
    icon: UserCog,
    color: "bg-blue-600",
    hoverColor: "hover:border-blue-400/40 hover:shadow-lg",
    path: "/manager",
  },
  {
    id: "driver",
    title: "Sofor",
    description: "Profilinizi, aracinizi, seferlerinizi gorun. Kaza bildirimi, bakim talebi ve gunluk kontrol yapin.",
    icon: Truck,
    color: "bg-emerald-600",
    hoverColor: "hover:border-emerald-400/40 hover:shadow-lg",
    path: "/driver",
  },
];

export function RoleSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4">
            <Truck className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl mb-2">Filo Yonetim Sistemi</h1>
          <p className="text-muted-foreground">Devam etmek icin bir rol secin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => navigate(role.path)}
                className={`group p-6 rounded-xl border border-border bg-card text-left transition-all ${role.hoverColor}`}
              >
                <div className={`w-12 h-12 rounded-xl ${role.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="mb-2">{role.title}</h3>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
