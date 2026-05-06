import React, { useState, useEffect } from "react";
import { Building2, FileText, Mail, Phone, Globe, Calendar, Shield, MapPin } from "lucide-react";
import { StatusBadge } from "../../shared/StatusBadge";
import { apiFetch } from "../../../utils/api";
import { toast } from "sonner";

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground mt-0.5 font-medium">{value}</p>
      </div>
    </div>
  );
}

export function CompanyTab({ user }: { user?: any }) {
  const [driverCompany, setDriverCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }

    const fetchCompanyData = async () => {
      try {
        const data = await apiFetch(`/v1/companies/${user.companyId}`);
        setDriverCompany(data);
      } catch (error: any) {
        toast.error("Şirket bilgileri alınamadı.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [user]);

  if (isLoading) return <div className="text-muted-foreground">Şirket bilgileri yükleniyor...</div>;

  if (!driverCompany) return (
    <div className="p-6 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-sm">
      Herhangi bir şirkete bağlı değilsiniz veya şirket bilgisi bulunamadı.
    </div>
  );

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Bagli Oldugum Sirket</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard icon={Building2} label="Sirket Adi" value={driverCompany.companyName || driverCompany.name} />
        <InfoCard icon={FileText} label="Vergi Numarası" value={driverCompany.taxNumber || "Kayıtlı Değil"} />
        <InfoCard icon={Mail} label="E-posta" value={driverCompany.contactEmail || "Kayıtlı Değil"} />
        <InfoCard icon={Phone} label="Telefon" value={driverCompany.contactPhone || "Kayıtlı Değil"} />
        <InfoCard icon={MapPin} label="Adres" value={driverCompany.address || "Kayıtlı Değil"} />
        <InfoCard icon={Globe} label="Website" value={driverCompany.website || "Kayıtlı Değil"} />
        <InfoCard icon={Shield} label="Durum" value={(() => {
          const s = (user?.driverTripStatus || "").toLowerCase();
          if (s === "intrip" || s === "seferde" || s === "on_trip") return <StatusBadge label="Seferde" variant="info" />;
          if (s === "inactive" || s === "pasif") return <StatusBadge label="Pasif" variant="neutral" />;
          return <StatusBadge label="Aktif" variant="success" />;
        })()} />
      </div>
    </div>
  );
}
