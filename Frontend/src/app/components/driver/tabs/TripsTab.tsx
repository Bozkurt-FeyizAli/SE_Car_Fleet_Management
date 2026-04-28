import React, { useState, useEffect } from "react";
import { StatusBadge } from "../../shared/StatusBadge";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";
import { MapPin, Navigation, Flag, CheckCircle2, XCircle, Clock, ClipboardList } from "lucide-react";
import { FormDialog, Field } from "../../shared/FormDialog";
import { Input } from "../../ui/input";

export function TripsTab() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<string>("");
  const [tripHistory, setTripHistory] = useState<any[]>([]);

  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [endKm, setEndKm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) throw new Error("No user in storage");
      const parsedUser = JSON.parse(storedUser);

      const [usersRes, driversRes] = await Promise.all([
        fetch("/api/User"),
        fetch("/api/Drivers")
      ]);

      if (!usersRes.ok || !driversRes.ok) throw new Error("Veriler yüklenemedi");

      const users: any[] = await usersRes.json();
      const drivers: any[] = await driversRes.json();

      const matchedUser = users.find(u => u.email === parsedUser.email);
      if (!matchedUser) throw new Error("Kullanıcı bulunamadı");

      const matchedDriver = drivers.find(d => d.userId === matchedUser.id);
      const fullDriver = {
        ...matchedUser,
        driverId: matchedDriver?.id,
        assignedVehiclePlate: matchedDriver?.vehiclePlate || matchedUser.assignedVehiclePlate
      };

      setCurrentUser(fullDriver);
      setAssignedVehicle(fullDriver.assignedVehiclePlate || "");

      // Lokasyonları çek
      const locs = await apiFetch(`/Locations/company/${matchedUser.companyId}`);
      if (Array.isArray(locs)) setLocations(locs);

      // Tüm seferleri çek ve filtrele
      const allTrips = await apiFetch("/Trips/all");
      if (Array.isArray(allTrips)) {
        const myDriverId = matchedDriver?.id;

        // Aktif sefer (InTrip)
        const myActive = allTrips.find((t: any) =>
          t.driverId === myDriverId && t.status === "InTrip"
        );
        setActiveTrip(myActive || null);

        // Bekleyen görevler (Preparing — yönetici tarafından atandı, şoför onaylamadı)
        const myPending = allTrips.filter((t: any) =>
          t.driverId === myDriverId && t.status === "Preparing"
        );
        setPendingTasks(myPending);

        // Tamamlanan geçmiş
        const myHistory = allTrips
          .filter((t: any) => t.driverId === myDriverId && t.status === "Completed")
          .sort((a: any, b: any) => new Date(b.endTime || 0).getTime() - new Date(a.endTime || 0).getTime());
        setTripHistory(myHistory);
      }
    } catch (err) {
      console.error("TripsTab fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAcceptTrip = async (tripId: number) => {
    try {
      await apiFetch(`/Trips/${tripId}/accept`, { method: "PATCH" });
      toast.success("Görevi kabul ettiniz! İyi yolculuklar. 🚛");
      fetchData();
    } catch (err: any) {
      toast.error("Görev kabul edilemedi: " + err.message);
    }
  };

  const handleRejectTrip = async (tripId: number) => {
    try {
      await apiFetch(`/Trips/${tripId}/reject`, { method: "PATCH" });
      toast.info("Görev reddedildi. Yöneticinize bildirilecek.");
      fetchData();
    } catch (err: any) {
      toast.error("Görev reddedilemedi: " + err.message);
    }
  };

  const handleCompleteTrip = async () => {
    if (!endKm || !activeTrip) return;
    try {
      await apiFetch(`/Trips/${activeTrip.id}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ endKm: parseInt(endKm, 10) })
      });
      toast.success("Sefer başarıyla tamamlandı!");
      setShowCompleteForm(false);
      setEndKm("");
      fetchData();
    } catch (err: any) {
      toast.error("Sefer tamamlanamadı: " + err.message);
    }
  };

  const locName = (id: number) =>
    locations.find(l => l.id === id)?.locationName || `Konum #${id}`;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Görevleriniz kontrol ediliyor...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight">Seferlerim ve Görevlerim</h2>

      {/* AKTİF SEFER */}
      {activeTrip && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-emerald-700 dark:text-emerald-400">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 dark:bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600 dark:bg-emerald-500"></span>
            </span>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5"/> ŞU AN SEFERDESİNİZ
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900/50 border border-border/50 rounded-md p-4 mb-6 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Başlangıç Noktası</p>
              <p className="font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400"/>
                {locName(activeTrip.startLocationId)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Varış Noktası</p>
              <p className="font-medium text-foreground flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-600 dark:text-red-400"/>
                {locName(activeTrip.endLocationId)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Kullanılan Araç</p>
              <p className="font-medium text-foreground">{activeTrip.vehiclePlate || assignedVehicle || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Başlama Zamanı</p>
              <p className="font-medium text-foreground">
                {activeTrip.startTime ? new Date(activeTrip.startTime).toLocaleString("tr-TR") : "—"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCompleteForm(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-md transition-colors"
          >
            Geri Döndüm / Seferi Tamamla
          </button>
        </div>
      )}

      {/* BEKLEYİP GÖREVLER */}
      {!activeTrip && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium border-b border-border pb-2 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500"/>
            Bekleyen Görevlerim
            {pendingTasks.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingTasks.length}
              </span>
            )}
          </h3>

          {pendingTasks.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {pendingTasks.map(task => (
                <div key={task.id} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400"/>
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                          Görev #{task.id} — Onayınız Bekleniyor
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
                        <div className="flex items-center gap-2 text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0"/>
                          <span><span className="text-muted-foreground">Nereden:</span> {locName(task.startLocationId)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-foreground">
                          <Flag className="w-3.5 h-3.5 text-red-500 shrink-0"/>
                          <span><span className="text-muted-foreground">Nereye:</span> {locName(task.endLocationId)}</span>
                        </div>
                        <div className="text-foreground">
                          <span className="text-muted-foreground">Araç:</span> {task.vehiclePlate || assignedVehicle || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleRejectTrip(task.id)}
                        className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-medium text-sm px-4 py-2 rounded-md transition-colors"
                      >
                        <XCircle className="w-4 h-4"/> Reddet
                      </button>
                      <button
                        onClick={() => handleAcceptTrip(task.id)}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-4 py-2 rounded-md transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4"/> Kabul Et
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30"/>
              <p className="font-medium">Bekleyen göreviniz bulunmuyor.</p>
              <p className="text-sm mt-1">Yöneticiniz size bir görev atadığında burada görünecek.</p>
            </div>
          )}
        </div>
      )}

      {/* SEFER GEÇMİŞİ */}
      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium border-b border-border pb-2">Sefer Geçmişim</h3>
        {tripHistory.length > 0 ? (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Güzergah</th>
                  <th className="px-4 py-3">KM</th>
                  <th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tripHistory.map((trip) => (
                  <tr key={trip.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      {trip.endTime ? new Date(trip.endTime).toLocaleDateString("tr-TR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {locName(trip.startLocationId)} → {locName(trip.endLocationId)}
                    </td>
                    <td className="px-4 py-3">
                      {trip.endKm && trip.startKm ? `${Number(trip.endKm) - Number(trip.startKm)} km` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label="Tamamlandı" variant="success" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
            Henüz tamamlanmış bir seferiniz bulunmuyor.
          </div>
        )}
      </div>

      <FormDialog
        open={showCompleteForm}
        onClose={() => setShowCompleteForm(false)}
        title="Seferi Tamamla"
        onSubmit={handleCompleteTrip}
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Lütfen aracı park ettikten sonra göstergedeki güncel kilometre değerini girin.
          </p>
          <Field label="Araç Güncel Kilometresi">
            <Input
              type="number"
              value={endKm}
              onChange={e => setEndKm(e.target.value)}
              placeholder="Örn: 15450"
              required
            />
          </Field>
        </div>
      </FormDialog>
    </div>
  );
}
