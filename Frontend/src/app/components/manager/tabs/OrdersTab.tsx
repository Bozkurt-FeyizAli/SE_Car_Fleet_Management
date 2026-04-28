import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";
import { CheckCircle2, Plus, Clock, XCircle } from "lucide-react";
import { Button } from "../../ui/button";
import { FormDialog, Field } from "../../shared/FormDialog";

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
  driverName?: string;
  startLocationName?: string;
  endLocationName?: string;
}

export function OrdersTab() {
  const [data, setData] = useState<TripOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Görev Ata modal state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({
    driverId: "",
    vehiclePlate: "",
    startLocationId: "",
    endLocationId: "",
  });

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const allTrips = await apiFetch("/Trips/all");
      const tripList: TripOrder[] = Array.isArray(allTrips) ? allTrips : [];

      // Şoför bilgilerini çek
      let driverMap: Record<number, string> = {};
      let driverVehicleMap: Record<number, string> = {};
      try {
        const driversRes = await fetch("/api/Drivers");
        if (driversRes.ok) {
          const driversList: any[] = await driversRes.json();
          const usersRes = await fetch("/api/User");
          const usersList: any[] = usersRes.ok ? await usersRes.json() : [];

          driversList.forEach(d => {
            const user = usersList.find(u => u.id === d.userId);
            driverMap[d.id] = user
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
              : `Şoför #${d.id}`;
            driverVehicleMap[d.id] = d.vehiclePlate || "";
          });

          // Idle durumundaki tüm şoförler (aracı olan ve olmayan)
          const idleDrivers = driversList
            .filter(d => d.status === "Idle")
            .map(d => ({ ...d, name: driverMap[d.id] || `Şoför #${d.id}` }));
          setDrivers(idleDrivers);
        }
      } catch (err) {}

      // Şirkete ait + kiraladığımız boşta araçları çek
      try {
        const [vehiclesRes, activeTripsRes, myRentalsRes, allRentalsRes] = await Promise.all([
          fetch("/api/v1/vehicles"),
          apiFetch(`/Trips/active/${currentCompany.id}`),
          apiFetch(`/v1/rentals/my-rentals`).catch(() => []),  // sadece bizim kiralamalarımız
          apiFetch(`/v1/rentals/all`).catch(() => [])           // kiraya verdiklerimizi bulmak için
        ]);
        if (vehiclesRes.ok) {
          const allVehicles: any[] = await vehiclesRes.json();
          const myRentals: any[] = Array.isArray(myRentalsRes) ? myRentalsRes : [];
          const allRentals: any[] = Array.isArray(allRentalsRes) ? allRentalsRes : [];

          const activePlates = new Set(
            Array.isArray(activeTripsRes) ? activeTripsRes.map((t: any) => t.vehiclePlate) : []
          );

          // Kiraya VERDİĞİMİZ araçlar (onaylanmış + iade edilmemiş)
          const ourOwnPlates = new Set(
            allVehicles.filter(v => v.companyId === currentCompany.id).map(v => v.plate)
          );
          const rentedOutPlates = new Set(
            allRentals
              .filter((r: any) =>
                !r.returnDate &&
                r.renterCompanyId !== currentCompany.id &&
                ourOwnPlates.has(r.vehiclePlate) &&
                (r.status === "Approved" || r.status === "approved")
              )
              .map((r: any) => r.vehiclePlate)
          );

          // BİZİM KİRALADIKLARIMIZ — sadece onaylanmış (Approved) kiralamalar
          const rentedInPlates = new Set(
            myRentals
              .filter((r: any) =>
                !r.returnDate &&
                r.renterCompanyId === currentCompany.id &&
                (r.status === "Approved" || r.status === "approved")
              )
              .map((r: any) => r.vehiclePlate)
          );

          // Kendi boşta araçlarımız (kiraya verilmemiş)
          const ownIdle = allVehicles
            .filter(v =>
              v.companyId === currentCompany.id &&
              v.isActive !== false &&
              !activePlates.has(v.plate) &&
              !rentedOutPlates.has(v.plate)
            )
            .map(v => ({ ...v, isRentedIn: false }));

          // Bizim kiraladıklarımız (başka şirketin aracı, bize kiralanan, boşta)
          const rentedIn = allVehicles
            .filter(v =>
              rentedInPlates.has(v.plate) &&
              !activePlates.has(v.plate)
            )
            .map(v => ({ ...v, isRentedIn: true }));

          setVehicles([...ownIdle, ...rentedIn]);
        }
      } catch (err) {}

      // Konum bilgilerini çek
      let locationMap: Record<number, string> = {};
      try {
        const locRes = await apiFetch(`/Locations/company/${currentCompany.id}`);
        const locs: any[] = Array.isArray(locRes) ? locRes : [];
        locs.forEach(loc => {
          locationMap[loc.id] = loc.locationName || `Konum #${loc.id}`;
        });
        setLocations(locs);
      } catch (err) {}

      // Yalnızca bu şirkete ait seferleri göster (şoför eşleştirmesi)
      const enriched = tripList
        .filter(t => {
          const plate = driverVehicleMap[t.driverId];
          return true; // tüm seferleri göster, yönetici kendi şoförlerini görür
        })
        .map(trip => ({
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

  useEffect(() => { fetchOrders(); }, []);

  const getStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      "Preparing": "Onay Bekliyor",
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

  const handleAssignTask = async () => {
    if (!assignForm.driverId || !assignForm.vehiclePlate || !assignForm.startLocationId || !assignForm.endLocationId) {
      toast.error("Lütfen tüm alanları doldurun.");
      return;
    }
    if (assignForm.startLocationId === assignForm.endLocationId) {
      toast.error("Başlangıç ve varış noktası aynı olamaz.");
      return;
    }

    try {
      const payload = {
        driverId: Number(assignForm.driverId),
        vehiclePlate: assignForm.vehiclePlate,
        startLocationId: Number(assignForm.startLocationId),
        endLocationId: Number(assignForm.endLocationId),
      };

      await apiFetch("/Trips/start", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      toast.success("Görev başarıyla atandı! Şoför onayı bekleniyor.");
      setShowAssignForm(false);
      setAssignForm({ driverId: "", vehiclePlate: "", startLocationId: "", endLocationId: "" });
      fetchOrders();
    } catch (err: any) {
      toast.error("Görev atanamadı: " + err.message);
    }
  };

  const handleCancelTrip = async (tripId: number) => {
    try {
      await apiFetch(`/Trips/${tripId}/reject`, { method: "PATCH" });
      toast.success("Görev iptal edildi.");
      fetchOrders();
    } catch (err: any) {
      toast.error("İptal edilemedi: " + err.message);
    }
  };

  const columns: Column<TripOrder>[] = [
    { key: "id", header: "Sefer No", render: (o) => <span className="text-foreground font-medium">#{o.id}</span> },
    { key: "driver", header: "Şoför", render: (o) => o.driverName || "—" },
    { key: "vehicle", header: "Araç", render: (o) => o.vehiclePlate || "—" },
    { key: "start", header: "Kalkış", render: (o) => <span className="max-w-[120px] truncate block">{o.startLocationName}</span> },
    { key: "end", header: "Varış", render: (o) => <span className="max-w-[120px] truncate block">{o.endLocationName}</span> },
    { key: "startTime", header: "Başlangıç", render: (o) => o.status === "Preparing" ? <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>Onay bekleniyor</span> : formatDate(o.startTime) },
    { key: "endTime", header: "Bitiş", render: (o) => formatDate(o.endTime) },
    { key: "km", header: "Mesafe", render: (o) => {
        if (o.endKm && o.startKm) return `${(o.endKm - o.startKm).toLocaleString("tr-TR")} km`;
        return o.startKm ? `${Number(o.startKm).toLocaleString("tr-TR")} km (başl.)` : "—";
      }
    },
    { key: "fee", header: "Ücret", render: (o) => o.totalFee ? `₺${Number(o.totalFee).toLocaleString("tr-TR")}` : "—" },
    { key: "status", header: "Durum", render: (o) => <StatusBadge label={getStatusLabel(o.status)} variant={getStatusVariant(o.status)} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Seferler / Görevler</h2>
        <button
          onClick={() => setShowAssignForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4"/> Görev Ata
        </button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        searchPlaceholder="Sefer ara..."
        searchKeys={["vehiclePlate", "driverName", "startLocationName", "endLocationName"]}
        customActions={(o) => {
          if (o.status === "Preparing") {
            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancelTrip(o.id)}
                className="h-8 px-2 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/40"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">İptal Et</span>
              </Button>
            );
          }
          return null;
        }}
      />

      {data.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Henüz sefer bulunamadı.</p>
          <p className="text-sm mt-1">"Görev Ata" butonundan şoförlere yeni görev atayabilirsiniz.</p>
        </div>
      )}

      {/* GÖREV ATA MODALI */}
      <FormDialog
        open={showAssignForm}
        onClose={() => { setShowAssignForm(false); setAssignForm({ driverId: "", vehiclePlate: "", startLocationId: "", endLocationId: "" }); }}
        title="Şoföre Görev Ata"
        onSubmit={handleAssignTask}
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Görev atadığınızda şoför panelinde görünecek ve şoför kabul ettiğinde sefer başlayacak.
          </p>

          <Field label="Şoför Seç">
            <select
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm"
              value={assignForm.driverId}
              onChange={e => {
                const dId = e.target.value;
                const selectedDriver = drivers.find(d => d.id === Number(dId));
                setAssignForm({
                  ...assignForm,
                  driverId: dId,
                  // Şoförün aracı varsa otomatik seç, yoksa boş bırak
                  vehiclePlate: selectedDriver?.vehiclePlate || ""
                });
              }}
            >
              <option value="">Şoför seçiniz...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.vehiclePlate ? `(${d.vehiclePlate})` : "(Araç yok)"}
                </option>
              ))}
            </select>
            {drivers.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">Boşta olan şoför bulunamadı.</p>
            )}
          </Field>

          <Field label="Araç">
            <select
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm"
              value={assignForm.vehiclePlate}
              onChange={e => setAssignForm({ ...assignForm, vehiclePlate: e.target.value })}
            >
              <option value="">Araç seçiniz...</option>
              {vehicles.map(v => (
                <option key={v.plate} value={v.plate}>
                  {v.plate}
                  {v.brandModel ? ` — ${v.brandModel}` : ""}
                  {v.isRentedIn ? " (Kiralık)" : ""}
                  {(() => {
                    const ownerDriver = drivers.find(d => d.vehiclePlate === v.plate);
                    return ownerDriver && !v.isRentedIn ? " ✓ (Atanmış araç)" : "";
                  })()}
                </option>
              ))}
            </select>
            {vehicles.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">Boşta araç bulunamadı.</p>
            )}
          </Field>

          <Field label="Başlangıç Noktası">
            <select
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm"
              value={assignForm.startLocationId}
              onChange={e => setAssignForm({ ...assignForm, startLocationId: e.target.value })}
            >
              <option value="">Konum seçiniz...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.locationName}</option>
              ))}
            </select>
          </Field>

          <Field label="Varış Noktası">
            <select
              className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm"
              value={assignForm.endLocationId}
              onChange={e => setAssignForm({ ...assignForm, endLocationId: e.target.value })}
            >
              <option value="">Konum seçiniz...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.locationName}</option>
              ))}
            </select>
          </Field>
        </div>
      </FormDialog>
    </div>
  );
}