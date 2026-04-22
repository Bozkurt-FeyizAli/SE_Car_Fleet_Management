import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../../ui/button";

interface TripOrder {
  id: number;
  driverId: number;
  vehiclePlate: string;
  startLocationId: number;
  endLocationId: number;
  startTime: string;
  endTime: string | null;
  startKm: number;
  endKm: number | null;
  totalFee: number;
  status: string;
  // Frontend-enriched fields
  driverName?: string;
  startLocationName?: string;
  endLocationName?: string;
}

export function OrdersTab() {
  const [data, setData] = useState<TripOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Aktif seferleri çek
      const trips = await apiFetch(`/Trips/active/${currentCompany.id}`);
      const tripList: TripOrder[] = Array.isArray(trips) ? trips : [];

      // Şoför bilgilerini çek
      let driverMap: Record<number, string> = {};
      try {
        const driversRes = await fetch("/api/Drivers");
        if (driversRes.ok) {
          const drivers: any[] = await driversRes.json();
          drivers.forEach(d => {
            // Driver tablosundan kullanıcı bilgisini al
            driverMap[d.id] = `Şoför #${d.id}`;
          });

          // Kullanıcı adlarını çek
          const usersRes = await fetch("/api/User");
          if (usersRes.ok) {
            const users: any[] = await usersRes.json();
            drivers.forEach(d => {
              const user = users.find(u => u.id === d.userId);
              if (user) {
                driverMap[d.id] = `${user.firstName || ""} ${user.lastName || ""}`.trim();
              }
            });
          }
        }
      } catch (err) {}

      // Konum bilgilerini çek
      let locationMap: Record<number, string> = {};
      try {
        const locRes = await apiFetch(`/Locations/company/${currentCompany.id}`);
        const locations: any[] = Array.isArray(locRes) ? locRes : [];
        locations.forEach(loc => {
          locationMap[loc.id] = loc.locationName || loc.fullAddress || `Konum #${loc.id}`;
        });
      } catch (err) {}

      // Verileri zenginleştir
      const enriched = tripList.map(trip => ({
        ...trip,
        driverName: driverMap[trip.driverId] || `Şoför #${trip.driverId}`,
        startLocationName: locationMap[trip.startLocationId] || `Konum #${trip.startLocationId}`,
        endLocationName: locationMap[trip.endLocationId] || `Konum #${trip.endLocationId}`,
      }));

      setData(enriched);
    } catch (e: any) {
      toast.error("Seferler yüklenemedi: " + (e.message || "Hata oluştu"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      "Preparing": "Hazırlanıyor",
      "InTrip": "Seferde",
      "Completed": "Tamamlandı",
      "Cancelled": "İptal Edildi",
    };
    return map[status] || status;
  };

  const getStatusVariant = (status: string): "success" | "danger" | "warning" | "info" | "neutral" => {
    switch (status) {
      case "InTrip": return "info";
      case "Completed": return "success";
      case "Cancelled": return "danger";
      case "Preparing": return "warning";
      default: return "neutral";
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const columns: Column<TripOrder>[] = [
    { key: "id", header: "Sefer No", render: (o) => <span className="text-foreground font-medium">#{o.id}</span> },
    { key: "driver", header: "Şoför", render: (o) => o.driverName || "—" },
    { key: "vehicle", header: "Araç", render: (o) => o.vehiclePlate || "—" },
    { key: "start", header: "Kalkış", render: (o) => <span className="max-w-[120px] truncate block">{o.startLocationName}</span> },
    { key: "end", header: "Varış", render: (o) => <span className="max-w-[120px] truncate block">{o.endLocationName}</span> },
    { key: "startTime", header: "Başlangıç", render: (o) => formatDate(o.startTime) },
    { key: "endTime", header: "Bitiş", render: (o) => formatDate(o.endTime) },
    { key: "km", header: "Mesafe", render: (o) => {
        if (o.endKm && o.startKm) {
          const dist = o.endKm - o.startKm;
          return `${dist.toLocaleString("tr-TR")} km`;
        }
        return `${Number(o.startKm).toLocaleString("tr-TR")} km (başl.)`;
      }
    },
    { key: "fee", header: "Ücret", render: (o) => o.totalFee ? `₺${Number(o.totalFee).toLocaleString("tr-TR")}` : "—" },
    { key: "status", header: "Durum", render: (o) => <StatusBadge label={getStatusLabel(o.status)} variant={getStatusVariant(o.status)} /> },
  ];

  const handleCompleteTrip = async (tripId: number) => {
    try {
      const trip = data.find(t => t.id === tripId);
      const estimatedEndKm = trip ? (Number(trip.startKm || 0) + Math.floor(50 + Math.random() * 200)) : 1000;

      await apiFetch(`/Trips/${tripId}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ endKm: estimatedEndKm })
      });
      toast.success("Sefer başarıyla tamamlandı!");
      fetchOrders();
    } catch(err: any) {
      toast.error("Hata: " + err.message);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Seferler / Siparişler</h2>
      <DataTable
        data={data}
        columns={columns}
        searchPlaceholder="Sefer ara..."
        searchKeys={["vehiclePlate", "driverName", "startLocationName", "endLocationName"]}
        customActions={(o) => {
          if (o.status === "InTrip") {
            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCompleteTrip(o.id)}
                className="h-8 px-2 text-xs gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Seferi Bitir</span>
              </Button>
            );
          }
          return null;
        }}
      />
      {data.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aktif sefer bulunamadı.</p>
          <p className="text-sm mt-1">Şoförler sekmesinden yeni sefer başlatabilirsiniz.</p>
        </div>
      )}
    </div>
  );
}