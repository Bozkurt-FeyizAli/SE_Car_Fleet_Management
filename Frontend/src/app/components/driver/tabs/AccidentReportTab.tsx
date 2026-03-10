import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Button } from "../../ui/button";
import { Field } from "../../shared/FormDialog";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { accidentReports, vehicles, AccidentReport, nextId, getVehiclePlate } from "../../../data/mockData";
import { currentDriver } from "../DriverPanel";
import { toast } from "sonner";

export function AccidentReportTab() {
  const myReports = () => accidentReports.filter(r => r.driver_id === currentDriver.id);
  const [data, setData] = useState(myReports());
  const driverVehicle = vehicles.find(v => v.current_driver_id === currentDriver.id);

  const [form, setForm] = useState({
    description: "",
    location: "",
    severity: "minor" as AccidentReport["severity"],
    date: new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = () => {
    if (!form.description || !form.location) {
      toast.error("Lutfen aciklama ve konum bilgilerini girin");
      return;
    }
    const newReport: AccidentReport = {
      id: nextId(),
      driver_id: currentDriver.id,
      vehicle_id: driverVehicle?.id ?? 0,
      description: form.description,
      location: form.location,
      date: form.date,
      severity: form.severity,
      status: "reported",
      photos: [],
      created_at: new Date().toISOString(),
    };
    accidentReports.push(newReport);
    setData(myReports());
    setForm({ description: "", location: "", severity: "minor", date: new Date().toISOString().slice(0, 10) });
    toast.success("Kaza bildirimi basariyla gonderildi");
  };

  const columns: Column<AccidentReport>[] = [
    { key: "date", header: "Tarih", render: (r) => new Date(r.date).toLocaleDateString("tr-TR") },
    { key: "vehicle", header: "Arac", render: (r) => getVehiclePlate(r.vehicle_id) },
    { key: "location", header: "Konum", render: (r) => r.location },
    { key: "severity", header: "Siddet", render: (r) => <StatusBadge label={getStatusLabel(r.severity)} variant={getStatusVariant(r.severity)} /> },
    { key: "desc", header: "Aciklama", render: (r) => <span className="max-w-[200px] truncate block">{r.description}</span> },
    { key: "status", header: "Durum", render: (r) => <StatusBadge label={getStatusLabel(r.status)} variant={getStatusVariant(r.status)} /> },
  ];

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Yeni Kaza Bildirimi
          </CardTitle>
          <CardDescription>Kaza durumunda asagidaki formu doldurarak bildirim yapin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Tarih">
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Konum *">
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ornegin: Istanbul - Ankara otoyolu, 150. km" />
          </Field>
          <Field label="Siddet">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as AccidentReport["severity"] })}>
              <option value="minor">Hafif</option>
              <option value="moderate">Orta</option>
              <option value="major">Agir</option>
            </select>
          </Field>
          <Field label="Aciklama *">
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Kaza ile ilgili detayli aciklama yazin..." rows={4} />
          </Field>
          {driverVehicle && (
            <div className="text-sm text-muted-foreground p-2 rounded bg-muted/30">
              Arac: {driverVehicle.plate_number} — {driverVehicle.brand} {driverVehicle.model}
            </div>
          )}
          <Button variant="destructive" onClick={handleSubmit} className="w-full">
            <AlertTriangle className="w-4 h-4" />
            Kaza Bildir
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3">Gecmis Bildirimlerin</h3>
        <DataTable data={data} columns={columns} searchPlaceholder="Bildirim ara..." searchKeys={["location", "description"]} />
      </div>
    </div>
  );
}
