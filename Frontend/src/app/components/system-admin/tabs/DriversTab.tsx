import React, { useState } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge, getStatusVariant, getStatusLabel } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { drivers, companies, departments, Driver, nextId, getCompanyName, getVehiclePlate, getDepartmentName } from "../../../data/mockData";
import { toast } from "sonner";

export function DriversTab() {
  const [data, setData] = useState([...drivers]);
  const [editItem, setEditItem] = useState<Driver | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Driver | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", identity_number: "", license_number: "", license_class: "C", hire_date: "", company_id: "", department_id: "", status: "active" as Driver["status"], email: "" });

  const openAdd = () => {
    setForm({ first_name: "", last_name: "", phone: "", identity_number: "", license_number: "", license_class: "C", hire_date: "", company_id: "", department_id: "", status: "active", email: "" });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: Driver) => {
    setForm({ first_name: item.first_name, last_name: item.last_name, phone: item.phone, identity_number: item.identity_number, license_number: item.license_number, license_class: item.license_class, hire_date: item.hire_date, company_id: item.company_id.toString(), department_id: item.department_id.toString(), status: item.status, email: item.email });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.first_name || !form.last_name || !form.license_number) { toast.error("Zorunlu alanlari doldurun"); return; }
    if (editItem) {
      const updated = data.map(d => d.id === editItem.id ? { ...d, ...form, company_id: Number(form.company_id), department_id: Number(form.department_id), updated_at: new Date().toISOString() } : d);
      setData(updated);
      drivers.splice(0, drivers.length, ...updated);
      toast.success("Sofor guncellendi");
    } else {
      const newItem: Driver = { id: nextId(), ...form, company_id: Number(form.company_id) || 1, department_id: Number(form.department_id) || 1, user_id: null, current_score: 80, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const updated = [...data, newItem];
      setData(updated);
      drivers.splice(0, drivers.length, ...updated);
      toast.success("Sofor eklendi");
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    const updated = data.filter(d => d.id !== deleteItem.id);
    setData(updated);
    drivers.splice(0, drivers.length, ...updated);
    setDeleteItem(null);
    toast.success("Sofor silindi");
  };

  const columns: Column<Driver>[] = [
    { key: "name", header: "Ad Soyad", render: (d) => `${d.first_name} ${d.last_name}` },
    { key: "license", header: "Ehliyet No", render: (d) => d.license_number },
    { key: "class", header: "Sinif", render: (d) => d.license_class },
    { key: "score", header: "Puan", render: (d) => <span className={d.current_score >= 80 ? "text-emerald-600" : d.current_score >= 60 ? "text-amber-600" : "text-red-600"}>{d.current_score}</span> },
    { key: "company", header: "Sirket", render: (d) => getCompanyName(d.company_id) },
    { key: "dept", header: "Departman", render: (d) => getDepartmentName(d.department_id) },
    { key: "status", header: "Durum", render: (d) => <StatusBadge label={getStatusLabel(d.status)} variant={getStatusVariant(d.status)} /> },
  ];

  return (
    <div>
      <h2 className="mb-4">Soforler</h2>
      <DataTable data={data} columns={columns} searchPlaceholder="Sofor ara..." searchKeys={["first_name", "last_name", "license_number"]} onAdd={openAdd} addLabel="Sofor Ekle" onEdit={openEdit} onDelete={(d) => setDeleteItem(d)} />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Sofor Duzenle" : "Yeni Sofor"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Ad *"><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} /></Field>
          <Field label="Soyad *"><Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} /></Field>
          <Field label="E-posta"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Telefon"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="TC Kimlik No"><Input value={form.identity_number} onChange={e => setForm({ ...form, identity_number: e.target.value })} /></Field>
          <Field label="Ehliyet No *"><Input value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} /></Field>
          <Field label="Ehliyet Sinifi">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.license_class} onChange={e => setForm({ ...form, license_class: e.target.value })}>
              {["B", "C", "D", "E"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Ise Baslama"><Input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} /></Field>
          <Field label="Sirket">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })}>
              <option value="">Sec...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Departman">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Sec...</option>
              {departments.filter(dep => !form.company_id || dep.company_id === Number(form.company_id)).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Durum">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Driver["status"] })}>
              <option value="active">Aktif</option>
              <option value="on_trip">Seferde</option>
              <option value="off_duty">Izinli</option>
              <option value="inactive">Pasif</option>
            </select>
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Sofor Sil" message={`"${deleteItem?.first_name} ${deleteItem?.last_name}" soforunu silmek istediginize emin misiniz?`} />
    </div>
  );
}