import React from 'react';
import { ApiUser } from '../../manager/tabs/DriversTab';

interface ProfileTabProps {
  user: ApiUser | null;
}

export function ProfileTab({ user }: ProfileTabProps) {
  if (!user) {
    return <div className="p-6 text-center text-muted-foreground">Profil bilgileri yüklenemedi.</div>;
  }

  // Handle null values gracefully
  const firstName = user.firstName || "Bilinmiyor";
  const lastName = user.lastName || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const driverScore = user.driverScore ?? 0;
  const statusLabel = user.driverTripStatus === "active" ? "Aktif" : user.driverTripStatus === "on_trip" ? "Seferde" : "Pasif";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Profil Özeti Kartı */}
      <div className="bg-card p-6 rounded-xl border border-border flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 shrink-0 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
          {initials}
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold">{firstName} {lastName}</h2>
          <p className="text-muted-foreground">Sürücü ID: {user.id}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
            <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-medium">
              Sürücü Skoru: {driverScore}
            </span>
            <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full font-medium">
              {statusLabel}
            </span>
            {user.assignedVehicleId && (
              <span className="bg-slate-100 text-slate-800 text-xs px-3 py-1.5 rounded-full font-medium">
                Araç ID: {user.assignedVehicleId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kişisel Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Kişisel Bilgiler</h3>
          <div className="space-y-3">
            <InfoField label="TC Kimlik No" value={user.tcIdentityNumber || "Belirtilmedi"} />
            <InfoField label="E-posta" value={user.email || "Belirtilmedi"} />
            <InfoField label="Telefon" value={user.phone || "Belirtilmedi"} />
            <InfoField label="Sicil Kaydı" value={user.criminalRecord || "Temiz"} />
          </div>
        </div>

        {/* Ehliyet Bilgileri */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Ehliyet & Yetkinlik</h3>
          <div className="space-y-3">
            <InfoField label="Ehliyet No" value={user.driverLicenseId || "Belirtilmedi"} />
            <InfoField label="Rol ID" value={user.roleId?.toString() || "Bilinmiyor"} />
            <InfoField label="Bağlı Yönetici ID" value={user.parentUserId?.toString() || "Bilinmiyor"} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Yardımcı Alt Bileşen
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors px-1 rounded-sm">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium text-right max-w-[60%] truncate" title={value}>{value}</span>
    </div>
  );
}

export default ProfileTab;