import React from 'react';
// Mock verileri ve yardımcı fonksiyonları içeri aktaralım
import { drivers, companies } from '../../../data/mockData';

export function ProfileTab() {
  // 1. ADIM: Aktif sürücüyü mock veriden alalım (Hasan Aydın)
  // Backend bağlandığında burası: JSON.parse(localStorage.getItem('user') || '{}') olacak.
  const currentDriver = drivers.find(d => d.id === 1)!;
  const driverCompany = companies.find(c => c.id === currentDriver.company_id)!;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Profil Özeti Kartı */}
      <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
          {currentDriver.first_name[0]}{currentDriver.last_name[0]}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{currentDriver.first_name} {currentDriver.last_name}</h2>
          <p className="text-muted-foreground">{driverCompany.name}</p>
          <div className="flex gap-2 mt-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full">
              Sürücü Skoru: {currentDriver.current_score}
            </span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Aktif Görevde
            </span>
          </div>
        </div>
      </div>

      {/* Kişisel Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Kişisel Bilgiler</h3>
          <div className="space-y-3">
            <InfoField label="TC Kimlik No" value={currentDriver.identity_number} />
            <InfoField label="E-posta" value={currentDriver.email} />
            <InfoField label="Telefon" value={currentDriver.phone} />
            <InfoField label="İşe Giriş Tarihi" value={new Date(currentDriver.hire_date).toLocaleDateString('tr-TR')} />
          </div>
        </div>

        {/* Ehliyet Bilgileri */}
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Ehliyet & Yetkinlik</h3>
          <div className="space-y-3">
            <InfoField label="Ehliyet No" value={currentDriver.license_number} />
            <InfoField label="Ehliyet Sınıfı" value={currentDriver.license_class} />
            <InfoField label="Statü" value={currentDriver.status.replace('_', ' ').toUpperCase()} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Yardımcı Alt Bileşen
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default ProfileTab;