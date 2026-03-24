import React, { useState } from "react";
import { Wrench, AlertCircle, FileText, ClipboardCheck, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Button } from "../../ui/button";
import { Field } from "../../shared/FormDialog";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { DataTable, Column } from "../../shared/DataTable";
import { maintenanceRequests, dailyChecks, vehicles, MaintenanceRequest, DailyCheck, nextId } from "../../../data/mockData";
const currentDriver = {
  id: 1,
  name: "Ahmet Yilmaz",
  tc: "12345678901",
  phone: "555 123 4567",
  email: "ahmet@mail.com",
  license_type: "E",
  company_id: 101, 
  department_id: 201, 
  points: 100,
  status: "active" as const
};
import { toast } from "sonner";

export function QuickActionsTab() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const driverVehicle = vehicles.find(v => v.current_driver_id === currentDriver.id);

  const sections = [
    { id: "maintenance", label: "Bakim Talep Et", icon: Wrench, color: "bg-blue-100 text-blue-800", desc: "Araciniz icin bakim talebi olusturun" },
    { id: "issue", label: "Sorun Bildir", icon: AlertCircle, color: "bg-amber-100 text-amber-800", desc: "Aracla ilgili sorun bildirin" },
    { id: "documents", label: "Belgelerim", icon: FileText, color: "bg-violet-100 text-violet-800", desc: "Belgelerinizi goruntuleyin" },
    { id: "daily_check", label: "Gunluk Kontrol", icon: ClipboardCheck, color: "bg-emerald-100 text-emerald-800", desc: "Gunluk arac kontrolu yapin" },
  ];

  return (
    <div className="space-y-6">
      <h2>Hizli Islemler</h2>

      {!activeSection && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActiveSection(s.id)} className="p-6 rounded-xl border border-border bg-card text-left hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mb-1">{s.label}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      {activeSection && (
        <div>
          <Button variant="ghost" onClick={() => setActiveSection(null)} className="mb-4">&larr; Geri</Button>
          {activeSection === "maintenance" && <MaintenanceSection />}
          {activeSection === "issue" && <IssueSection />}
          {activeSection === "documents" && <DocumentsSection />}
          {activeSection === "daily_check" && <DailyCheckSection />}
        </div>
      )}
    </div>
  );
}

function MaintenanceSection() {
  const driverVehicle = vehicles.find(v => v.current_driver_id === currentDriver.id);
  const myRequests = () => maintenanceRequests.filter(r => r.driver_id === currentDriver.id);
  const [data, setData] = useState(myRequests());
  const [form, setForm] = useState({ type: "Periyodik Bakim", description: "", urgency: "medium" as MaintenanceRequest["urgency"] });

  const handleSubmit = () => {
    if (!form.description) { toast.error("Aciklama girin"); return; }
    maintenanceRequests.push({ id: nextId(), driver_id: currentDriver.id, vehicle_id: driverVehicle?.id ?? 0, ...form, status: "pending", created_at: new Date().toISOString() });
    setData(myRequests());
    setForm({ type: "Periyodik Bakim", description: "", urgency: "medium" });
    toast.success("Bakim talebi gonderildi");
  };

  const columns: Column<MaintenanceRequest>[] = [
    { key: "date", header: "Tarih", render: (r) => new Date(r.created_at).toLocaleDateString("tr-TR") },
    { key: "type", header: "Tip", render: (r) => r.type },
    { key: "urgency", header: "Aciliyet", render: (r) => <StatusBadge label={getStatusLabel(r.urgency)} variant={getStatusVariant(r.urgency)} /> },
    { key: "desc", header: "Aciklama", render: (r) => <span className="max-w-[200px] truncate block">{r.description}</span> },
    { key: "status", header: "Durum", render: (r) => <StatusBadge label={getStatusLabel(r.status)} variant={getStatusVariant(r.status)} /> },
  ];

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="w-4 h-4" /> Yeni Bakim Talebi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Field label="Bakim Tipi">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option>Periyodik Bakim</option><option>Lastik Degisimi</option><option>Fren Bakimi</option><option>Motor Bakimi</option><option>Yag Degisimi</option><option>Diger</option>
            </select>
          </Field>
          <Field label="Aciliyet">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value as MaintenanceRequest["urgency"] })}>
              <option value="low">Dusuk</option><option value="medium">Orta</option><option value="high">Yuksek</option>
            </select>
          </Field>
          <Field label="Aciklama *"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Bakim talebinizi aciklayin..." /></Field>
          <Button onClick={handleSubmit}><Wrench className="w-4 h-4" /> Talep Gonder</Button>
        </CardContent>
      </Card>
      <h3>Gecmis Taleplerim</h3>
      <DataTable data={data} columns={columns} searchPlaceholder="Talep ara..." searchKeys={["type", "description"]} />
    </div>
  );
}

function IssueSection() {
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" });

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Sorun Bildir</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Field label="Sorun Basligi"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Sorunun kisa aciklamasi" /></Field>
        <Field label="Oncelik">
          <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Dusuk</option><option value="medium">Orta</option><option value="high">Yuksek</option>
          </select>
        </Field>
        <Field label="Detayli Aciklama"><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Sorunu detayli aciklayin..." rows={4} /></Field>
        <Button onClick={() => { toast.success("Sorun bildirimi gonderildi"); setForm({ title: "", description: "", priority: "medium" }); }}>
          <AlertCircle className="w-4 h-4" /> Bildir
        </Button>
      </CardContent>
    </Card>
  );
}

function DocumentsSection() {
  const docs = [
    { id: 1, name: "Ehliyet", type: "Surucu Belgesi", expiry: "2027-05-15", status: "valid" },
    { id: 2, name: "SRC Belgesi", type: "Mesleki Yeterlilik", expiry: "2027-12-01", status: "valid" },
    { id: 3, name: "Psikoteknik Raporu", type: "Saglik Belgesi", expiry: "2026-06-15", status: "expiring" },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      <h3 className="flex items-center gap-2"><FileText className="w-4 h-4" /> Belgelerim</h3>
      {docs.map(doc => (
        <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm">{doc.name}</p>
              <p className="text-xs text-muted-foreground">{doc.type}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Gecerlilik: {new Date(doc.expiry).toLocaleDateString("tr-TR")}</p>
            <StatusBadge label={doc.status === "valid" ? "Gecerli" : "Suresi Yaklasiyor"} variant={doc.status === "valid" ? "success" : "warning"} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DailyCheckSection() {
  const driverVehicle = vehicles.find(v => v.current_driver_id === currentDriver.id);
  const myChecks = () => dailyChecks.filter(c => c.driver_id === currentDriver.id);
  const [data, setData] = useState(myChecks());
  const [form, setForm] = useState({ tire: "good" as DailyCheck["tire_condition"], brake: "good" as DailyCheck["brake_condition"], light: "good" as DailyCheck["light_condition"], oil: "good" as DailyCheck["oil_level"], fuel: "100", mileage: "", notes: "" });

  const handleSubmit = () => {
    if (!form.mileage) { toast.error("Kilometre bilgisini girin"); return; }
    dailyChecks.push({
      id: nextId(), driver_id: currentDriver.id, vehicle_id: driverVehicle?.id ?? 0,
      date: new Date().toISOString().slice(0, 10),
      tire_condition: form.tire, brake_condition: form.brake, light_condition: form.light, oil_level: form.oil,
      fuel_level: Number(form.fuel), mileage: Number(form.mileage), notes: form.notes,
      created_at: new Date().toISOString(),
    });
    setData(myChecks());
    setForm({ tire: "good", brake: "good", light: "good", oil: "good", fuel: "100", mileage: "", notes: "" });
    toast.success("Gunluk kontrol kaydedildi");
  };

  const conditionOptions = [
    { value: "good", label: "Iyi" },
    { value: "fair", label: "Orta" },
    { value: "poor", label: "Kotu" },
  ];

  const columns: Column<DailyCheck>[] = [
    { key: "date", header: "Tarih", render: (c) => new Date(c.date).toLocaleDateString("tr-TR") },
    { key: "tire", header: "Lastik", render: (c) => <StatusBadge label={getStatusLabel(c.tire_condition)} variant={getStatusVariant(c.tire_condition)} /> },
    { key: "brake", header: "Fren", render: (c) => <StatusBadge label={getStatusLabel(c.brake_condition)} variant={getStatusVariant(c.brake_condition)} /> },
    { key: "light", header: "Isik", render: (c) => <StatusBadge label={getStatusLabel(c.light_condition)} variant={getStatusVariant(c.light_condition)} /> },
    { key: "fuel", header: "Yakit %", render: (c) => `${c.fuel_level}%` },
    { key: "km", header: "KM", render: (c) => c.mileage.toLocaleString("tr-TR") },
    { key: "notes", header: "Not", render: (c) => c.notes || "—" },
  ];

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> Gunluk Arac Kontrolu</CardTitle>
          <CardDescription>Yola cikmadan once arac kontrolunuzu yapin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([["Lastik Durumu", "tire"], ["Fren Durumu", "brake"], ["Isik Durumu", "light"], ["Yag Seviyesi", "oil"]] as const).map(([label, key]) => (
              <Field key={key} label={label}>
                <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}>
                  {conditionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            ))}
            <Field label="Yakit Seviyesi (%)"><Input type="number" min="0" max="100" value={form.fuel} onChange={e => setForm({ ...form, fuel: e.target.value })} /></Field>
            <Field label="Kilometre *"><Input type="number" value={form.mileage} onChange={e => setForm({ ...form, mileage: e.target.value })} /></Field>
          </div>
          <Field label="Notlar"><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Ek notlariniz..." /></Field>
          <Button onClick={handleSubmit} className="w-full">
            <CheckCircle className="w-4 h-4" /> Kontrolu Kaydet
          </Button>
        </CardContent>
      </Card>

      <h3>Gecmis Kontrollerim</h3>
      <DataTable data={data} columns={columns} searchPlaceholder="Kontrol ara..." searchKeys={["notes"]} />
    </div>
  );
}