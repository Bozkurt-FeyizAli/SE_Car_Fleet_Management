import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";

export function RentalsTab() {
  const [data, setData] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // API'lerden tüm verileri çekiyoruz
      const [rentalsRes, companiesRes] = await Promise.all([
        fetch("/api/v1/rentals/all").catch(() => null),
        fetch("/api/v1/companies").catch(() => null),
      ]);

      let rentalsData: any = [];
      let companiesData: any[] = [];

      if (rentalsRes && rentalsRes.ok) {
        rentalsData = await rentalsRes.json();
      }
      if (companiesRes && companiesRes.ok) {
        companiesData = await companiesRes.json();
      }

      setCompanies(companiesData);

      // Wrapper formattan diziyi çıkar (Gerekirse)
      const rentalsList = Array.isArray(rentalsData) ? rentalsData : (rentalsData?.data || []);
      setData(rentalsList);

    } catch (error: any) {
      toast.error("Veriler getirilemedi: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getCompanyName = (id: number) => {
    const comp = companies.find((c: any) => c.id === id);
    return comp ? (comp.companyName || comp.name) : "Bilinmiyor";
  };

  const columns: Column<any>[] = [
    { key: "vehicle", header: "Araç Plaka", render: (r) => r.vehiclePlate || "—" },
    { key: "renter", header: "Kiralayan Şirket", render: (r) => getCompanyName(r.renterCompanyId) },
    { key: "price", header: "Toplam Ücret", render: (r) => `₺${(r.totalPrice || 0).toLocaleString("tr-TR")}` },
    { key: "start", header: "Başlangıç", render: (r) => r.startDate ? new Date(r.startDate).toLocaleDateString("tr-TR") : "—" },
    { key: "end", header: "Bitiş", render: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString("tr-TR") : "—" },
    { key: "return", header: "İade Tarihi", render: (r) => r.returnDate ? new Date(r.returnDate).toLocaleDateString("tr-TR") : "—" },
    { key: "status", header: "Durum", render: (r) => {
        const isActive = !r.returnDate;
        if (isActive) return <StatusBadge label="Devam Ediyor" variant="info" />;
        return <StatusBadge label="Tamamlandı" variant="success" />;
      } 
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Sistemdeki Tüm Kiralamalar</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Sistemdeki tüm şirketler arasındaki aktif ve geçmiş araç kiralamaları listelenmektedir. Yeni kiralama işlemleri Şirket Yöneticisi panelinden yapılabilir.
      </p>
      
      <DataTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Araç plakası ara..." 
        searchKeys={["vehiclePlate"]} 
      />
      
      {data.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Sistemde herhangi bir kiralama kaydı bulunamadı.
        </div>
      )}
    </div>
  );
}