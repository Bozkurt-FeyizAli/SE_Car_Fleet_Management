import React from "react";
import { Building2, FileText, Mail, Phone, Globe, Calendar, Shield, MapPin } from "lucide-react";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";

const driverCompany = {
  name: "Bozkurt Lojistik",
  tax_number: "1234567890",
  email: "iletisim@bozkurtlojistik.com",
  phone: "+90 555 123 45 67",
  address: "Atatürk Mah. Cumhuriyet Cad. No:1 Ataşehir/İstanbul",
  website: "www.bozkurtlojistik.com",
  status: "active",
  created_at: "2023-01-15T00:00:00.000Z"
};

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function CompanyTab() {
  return (
    <div>
      <h2 className="mb-4">Bagli Oldugum Sirket</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard icon={Building2} label="Sirket Adi" value={driverCompany.name} />
        <InfoCard icon={FileText} label="Vergi Numarasi" value={driverCompany.tax_number} />
        <InfoCard icon={Mail} label="E-posta" value={driverCompany.email} />
        <InfoCard icon={Phone} label="Telefon" value={driverCompany.phone} />
        <InfoCard icon={MapPin} label="Adres" value={driverCompany.address} />
        <InfoCard icon={Globe} label="Website" value={driverCompany.website} />
        <InfoCard icon={Shield} label="Durum" value={<StatusBadge label={getStatusLabel(driverCompany.status)} variant={getStatusVariant(driverCompany.status)} />} />
        <InfoCard icon={Calendar} label="Kurulus Tarihi" value={new Date(driverCompany.created_at).toLocaleDateString("tr-TR")} />
      </div>
    </div>
  );
}
