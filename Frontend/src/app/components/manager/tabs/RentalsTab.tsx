import React, { useState, useEffect } from "react";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";
import { CheckCircle2, XCircle, Clock, Truck, ArrowLeftRight, RotateCcw, Plus } from "lucide-react";

export function RentalsTab() {
  const [data, setData] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [liveCompanies, setLiveCompanies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [returnItem, setReturnItem] = useState<any | null>(null);
  const [form, setForm] = useState({
    ownerCompanyId: "",
    vehiclePlate: "",
    dynamicPrice: 0,
    dailyPrice: 0,
    rentalDays: 0,
    startDate: "",
    endDate: "",
    returnKm: 0
  });
  const [loading, setLoading] = useState(false);

  // ─────────────────────────────── FETCH ───────────────────────────────
  const fetchAll = async () => {
    try {
      const result = await apiFetch("/v1/rentals/my-rentals");
      setData(Array.isArray(result) ? result : (result?.data || []));
    } catch (error: any) {
      toast.error("Kiralamalar getirilemedi: " + error.message);
    }
  };

  const fetchAvailable = async (ownerId: number | string) => {
    if (!ownerId) { setAvailableVehicles([]); return; }
    try {
      const [vehiclesResult, allRentalsResult] = await Promise.all([
        apiFetch(`/v1/vehicles`),
        apiFetch(`/v1/rentals/all`).catch(() => [])
      ]);
      const vehicles = Array.isArray(vehiclesResult) ? vehiclesResult : (vehiclesResult?.data || []);
      const rentals  = Array.isArray(allRentalsResult) ? allRentalsResult : [];

      // Onaylanmış veya bekleyen aktif kiralamalar
      const blockedPlates = new Set(
        rentals
          .filter((r: any) => !r.returnDate && r.status !== "Rejected")
          .map((r: any) => r.vehiclePlate)
      );
      setAvailableVehicles(
        vehicles.filter((v: any) => v.companyId === Number(ownerId) && v.isActive && !blockedPlates.has(v.plate))
      );
    } catch (e) { console.error(e); }
  };

  const fetchCompanies = async () => {
    try {
      const r = await fetch("/api/v1/companies");
      if (r.ok) setLiveCompanies(await r.json());
    } catch (e) {}
  };

  const fetchAllVehicles = async () => {
    try {
      const r = await fetch("/api/v1/vehicles");
      if (r.ok) setAllVehicles(await r.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchAll();
    fetchCompanies();
    fetchAllVehicles();
  }, []);

  // ─────────────────────────────── HELPERS ───────────────────────────────
  const companyName = (id: number) => {
    if (!id) return "—";
    const c = liveCompanies.find((c: any) => c.id === id);
    return c ? (c.companyName || c.name) : `Şirket #${id}`;
  };

  const vehicleKm = (plate: string) => {
    const v = allVehicles.find((v: any) => v.plate === plate);
    return v?.currentKm || 0;
  };

  const ownerCompanyId = (plate: string) => {
    const v = allVehicles.find((v: any) => v.plate === plate);
    return v?.companyId || null;
  };

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString("tr-TR") : "—";

  // ─────────────────────────────── PRICE CALC ───────────────────────────────
  const calculatePrice = async (plate: string, days: number) => {
    if (!plate || days <= 0) return;
    try {
      const res = await apiFetch(`/v1/vehicles/${encodeURIComponent(plate)}/calculate-price?days=${days}`);
      if (res?.totalEstimatedPrice !== undefined) {
        setForm(p => ({ ...p, dynamicPrice: res.totalEstimatedPrice, dailyPrice: res.finalPricePerDay || res.totalEstimatedPrice / days, rentalDays: days }));
      } else {
        const base = availableVehicles.find((v: any) => v.plate === plate)?.baseRentPrice || 0;
        setForm(p => ({ ...p, dynamicPrice: base * days, dailyPrice: base, rentalDays: days }));
      }
    } catch {
      const base = availableVehicles.find((v: any) => v.plate === plate)?.baseRentPrice || 0;
      setForm(p => ({ ...p, dynamicPrice: base * days, dailyPrice: base, rentalDays: days }));
    }
  };

  useEffect(() => {
    if (form.vehiclePlate && form.startDate && form.endDate) {
      const days = Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000);
      if (days > 0) calculatePrice(form.vehiclePlate, days);
    }
  }, [form.vehiclePlate, form.startDate, form.endDate]);

  // ─────────────────────────────── ACTIONS ───────────────────────────────
  const handleSendRequest = async () => {
    if (!form.ownerCompanyId || !form.vehiclePlate || !form.startDate || !form.endDate) {
      toast.error("Zorunlu alanları doldurun.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/v1/rentals/request", {
        method: "POST",
        body: JSON.stringify({
          vehiclePlate: form.vehiclePlate,
          renterCompanyId: currentCompany.id,
          rentedCompanyId: Number(form.ownerCompanyId),
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          rentStartKm: vehicleKm(form.vehiclePlate)
        })
      });
      toast.success("Kiralama talebi gönderildi! Karşı şirketin onayı bekleniyor. ⏳");
      setShowForm(false);
      setForm({ ownerCompanyId: "", vehiclePlate: "", dynamicPrice: 0, dailyPrice: 0, rentalDays: 0, startDate: "", endDate: "", returnKm: 0 });
      fetchAll();
      fetchAllVehicles();
    } catch (e: any) {
      toast.error("Hata: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (rentalId: number) => {
    try {
      await apiFetch(`/v1/rentals/${rentalId}/approve`, { method: "PATCH" });
      toast.success("Kiralama talebi onaylandı. Araç kiralık olarak işaretlendi. ✅");
      fetchAll();
      fetchAllVehicles();
    } catch (e: any) {
      toast.error("Onaylama başarısız: " + e.message);
    }
  };

  const handleReject = async (rentalId: number) => {
    try {
      await apiFetch(`/v1/rentals/${rentalId}/reject`, { method: "PATCH" });
      toast.info("Kiralama talebi reddedildi.");
      fetchAll();
      fetchAllVehicles();
    } catch (e: any) {
      toast.error("Reddetme başarısız: " + e.message);
    }
  };

  const handleReturn = async () => {
    if (!returnItem) return;
    try {
      await apiFetch(`/v1/rentals/${returnItem.id}/return`, {
        method: "PATCH",
        body: JSON.stringify({
          returnDate: new Date().toISOString(),
          returnKm: Number(form.returnKm) || 0,
          totalPrice: Number(returnItem.totalPrice) || 0
        })
      });
      // Araç üzerinde aktif sefer varsa onu da kapat
      try {
        const ownId = ownerCompanyId(returnItem.vehiclePlate) || currentCompany.id;
        const trips = await apiFetch(`/Trips/active/${ownId}`);
        const trip = Array.isArray(trips) ? trips.find((t: any) => t.vehiclePlate === returnItem.vehiclePlate) : null;
        if (trip) {
          await apiFetch(`/Trips/${trip.id}/complete`, {
            method: "PATCH",
            body: JSON.stringify({ endKm: Number(form.returnKm) || 0 })
          });
        }
      } catch {}
      toast.success("Araç başarıyla iade edildi.");
      setReturnItem(null);
      fetchAll();
      fetchAllVehicles();
    } catch (e: any) {
      toast.error("İade başarısız: " + e.message);
    }
  };

  // ─────────────────────────────── SEGMENTS ───────────────────────────────
  // Gelen onay bekleyen talepler (biz araç sahibiyiz)
  const incomingPending = data.filter(r =>
    r.rentedCompanyId === currentCompany.id && r.status === "Pending"
  );

  // Bizim gönderdiğimiz, onay bekleyen talepler
  const outgoingPending = data.filter(r =>
    r.renterCompanyId === currentCompany.id && r.status === "Pending"
  );

  // Aktif (onaylanmış, iade edilmemiş) kiralamalar
  const activeRentals = data.filter(r =>
    r.status === "Approved" && !r.returnDate
  );

  // Geçmiş (iade edilmiş veya reddedilmiş)
  const pastRentals = data.filter(r =>
    r.returnDate || r.status === "Rejected" || r.status === "Completed"
  );

  // ─────────────────────────────── STATUS BADGE ───────────────────────────────
  const rentalStatusBadge = (r: any) => {
    if (r.status === "Pending") return <StatusBadge label="Onay Bekliyor" variant="warning" />;
    if (r.status === "Rejected") return <StatusBadge label="Reddedildi" variant="danger" />;
    if (r.returnDate || r.status === "Completed") return <StatusBadge label="Tamamlandı" variant="neutral" />;
    if (r.renterCompanyId === currentCompany.id) return <StatusBadge label="Kiralıyoruz" variant="info" />;
    if (r.rentedCompanyId === currentCompany.id) return <StatusBadge label="Kiraya Verdik" variant="warning" />;
    return <StatusBadge label="Aktif" variant="success" />;
  };

  const tableHeaderCls = "px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider";
  const tableCellCls = "px-4 py-3 text-sm text-foreground";

  const RentalTable = ({ rows, showActions = false }: { rows: any[], showActions?: boolean }) => (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50">
          <tr>
            <th className={tableHeaderCls}>Araç</th>
            <th className={tableHeaderCls}>Araç Sahibi</th>
            <th className={tableHeaderCls}>Kiralayan</th>
            <th className={tableHeaderCls}>Başlangıç</th>
            <th className={tableHeaderCls}>Bitiş</th>
            <th className={tableHeaderCls}>Ücret</th>
            <th className={tableHeaderCls}>Durum</th>
            {showActions && <th className={tableHeaderCls}>İşlemler</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(r => (
            <tr key={r.id} className="hover:bg-muted/20 transition-colors">
              <td className={tableCellCls + " font-medium"}>{r.vehiclePlate}</td>
              <td className={tableCellCls}>{companyName(r.rentedCompanyId || ownerCompanyId(r.vehiclePlate))}</td>
              <td className={tableCellCls}>{companyName(r.renterCompanyId)}</td>
              <td className={tableCellCls}>{fmt(r.startDate)}</td>
              <td className={tableCellCls}>{fmt(r.endDate)}</td>
              <td className={tableCellCls}>{r.totalPrice ? `₺${Number(r.totalPrice).toLocaleString("tr-TR")}` : "—"}</td>
              <td className={tableCellCls}>{rentalStatusBadge(r)}</td>
              {showActions && (
                <td className={tableCellCls}>
                  <div className="flex gap-2 flex-wrap">
                    {/* Gelen talepleri onaylayabiliriz */}
                    {r.status === "Pending" && r.rentedCompanyId === currentCompany.id && (
                      <>
                        <button onClick={() => handleApprove(r.id)} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Onayla
                        </button>
                        <button onClick={() => handleReject(r.id)} className="flex items-center gap-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                          <XCircle className="w-3.5 h-3.5" /> Reddet
                        </button>
                      </>
                    )}
                    {/* Kendi gönderdiğimiz onay bekleyenleri iptal edebiliriz */}
                    {r.status === "Pending" && r.renterCompanyId === currentCompany.id && (
                      <button onClick={() => handleReject(r.id)} className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> İptal Et
                      </button>
                    )}
                    {/* Kiralayan taraf iade edebilir */}
                    {r.status === "Approved" && !r.returnDate && r.renterCompanyId === currentCompany.id && (
                      <button onClick={() => { setForm(p => ({ ...p, returnKm: vehicleKm(r.vehiclePlate) })); setReturnItem(r); }} className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                        <RotateCcw className="w-3.5 h-3.5" /> İade Et
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const EmptyState = ({ text }: { text: string }) => (
    <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border text-sm">{text}</div>
  );

  // ─────────────────────────────── RENDER ───────────────────────────────
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Kiralık Araçlar</h2>
        <button
          onClick={() => { setShowForm(true); setAvailableVehicles([]); setForm({ ownerCompanyId: "", vehiclePlate: "", dynamicPrice: 0, dailyPrice: 0, rentalDays: 0, startDate: "", endDate: "", returnKm: 0 }); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Kiralama Talebi
        </button>
      </div>

      {/* ── GELEN BEKLEYEN TALEPLER ── */}
      {incomingPending.length > 0 && (
        <section>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
            Gelen Kiralama Talepleri
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{incomingPending.length}</span>
          </h3>
          <RentalTable rows={incomingPending} showActions />
        </section>
      )}

      {/* ── GİDEN BEKLEYEN TALEPLER ── */}
      {outgoingPending.length > 0 && (
        <section>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <ArrowLeftRight className="w-4 h-4" />
            Gönderilen Talepler (Onay Bekliyor)
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{outgoingPending.length}</span>
          </h3>
          <RentalTable rows={outgoingPending} showActions />
        </section>
      )}

      {/* ── AKTİF KİRALAMALAR ── */}
      <section>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600" /> Aktif Kiralamalar
        </h3>
        {activeRentals.length > 0
          ? <RentalTable rows={activeRentals} showActions />
          : <EmptyState text="Şu an aktif kiralama bulunmuyor." />
        }
      </section>

      {/* ── GEÇMİŞ ── */}
      <section>
        <h3 className="text-base font-semibold mb-3 text-muted-foreground">Geçmiş Kiralamalar</h3>
        {pastRentals.length > 0
          ? <RentalTable rows={pastRentals} />
          : <EmptyState text="Henüz tamamlanmış kiralama bulunmuyor." />
        }
      </section>

      {/* ── YENİ TALEP FORMU ── */}
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title="Kiralama Talebi Gönder" onSubmit={handleSendRequest} wide>
        <div className="space-y-5">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
            <strong>Nasıl çalışır?</strong> Talep gönderdiğinizde karşı şirket bildirim alır. Onaylarsa araç kiralanmış olur. Reddederse talep iptal edilir.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Araç Sahibi Şirket *">
              <select
                className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm"
                value={form.ownerCompanyId}
                onChange={e => {
                  const oId = e.target.value;
                  setForm({ ...form, ownerCompanyId: oId, vehiclePlate: "", dynamicPrice: 0 });
                  fetchAvailable(oId);
                }}
              >
                <option value="">Şirket seçiniz...</option>
                {liveCompanies.filter(c => c.id !== currentCompany.id).map(c => (
                  <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Araç Plakası *">
              <select
                className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm"
                value={form.vehiclePlate}
                onChange={e => { setForm(p => ({ ...p, vehiclePlate: e.target.value })); calculatePrice(e.target.value, 1); }}
                disabled={!form.ownerCompanyId}
              >
                <option value="">Araç seçiniz...</option>
                {availableVehicles.map((v: any) => (
                  <option key={v.plate} value={v.plate}>{v.plate} — Günlük ₺{(v.baseRentPrice || 0).toLocaleString("tr-TR")}</option>
                ))}
              </select>
              {form.ownerCompanyId && availableVehicles.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">Bu şirkette uygun araç bulunamadı.</p>
              )}
            </Field>

            <Field label="Başlangıç Tarihi *">
              <Input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </Field>

            <Field label="Bitiş Tarihi *">
              <Input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
            </Field>

            <Field label={`Tahmini Ücret${form.rentalDays > 0 ? ` (${form.rentalDays} gün)` : ""}`}>
              <Input type="number" readOnly value={form.dynamicPrice} className="bg-muted font-bold" />
            </Field>
          </div>
        </div>
      </FormDialog>

      {/* ── İADE FORMU ── */}
      <ConfirmDialog
        open={!!returnItem}
        onClose={() => setReturnItem(null)}
        onConfirm={handleReturn}
        title="Aracı İade Et"
        message={
          <div className="space-y-4">
            <p><strong>{returnItem?.vehiclePlate}</strong> plakalı aracı iade etmek istediğinize emin misiniz?</p>
            {returnItem && (
              <div className="text-sm bg-muted rounded-md p-3 space-y-1">
                <p>Kiralama Başlangıç KM: <strong>{Number(returnItem.rentStartKm || 0).toLocaleString("tr-TR")} km</strong></p>
                <p>Aracın Mevcut KM: <strong>{Number(vehicleKm(returnItem.vehiclePlate)).toLocaleString("tr-TR")} km</strong></p>
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Dönüş Kilometresi *</label>
              <Input
                type="number"
                placeholder="Güncel gösterge değeri"
                value={form.returnKm || ""}
                onChange={e => setForm(p => ({ ...p, returnKm: Number(e.target.value) }))}
              />
            </div>
          </div>
        }
      />
    </div>
  );
}
