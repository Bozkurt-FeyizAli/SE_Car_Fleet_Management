import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";

export interface ApiUser {
  id?: number;
  roleId?: number | null;
  parentManagerId: number | null;
  companyId: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  passwordHash: string | null;
  phoneNumber: string | null;
  tcIdentityNumber: string | null;
  criminalRecord: string | null;
  driverLicenseId?: string | null;
}

export function UsersTab() {
  const [data, setData] = useState<ApiUser[]>([]);
  const [editItem, setEditItem] = useState<ApiUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getInitialForm = (): ApiUser => ({
    parentManagerId: null,
    companyId: currentCompany.id,
    firstName: "",
    lastName: "",
    email: "",
    passwordHash: "",
    phoneNumber: "",
    tcIdentityNumber: "",
    criminalRecord: "",
  });

  const [form, setForm] = useState<ApiUser>(getInitialForm());

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/User");
      if (!res.ok) throw new Error("Kullanıcılar yüklenemedi");
      const list = await res.json();
      
      const managersOnly = list.filter((u: any) => {
        // Şirket uyuşmazlığı varsa geç
        if (u.companyId !== currentCompany.id) return false;
        
        // Şoförleri hariç tutmak için Heuristics
        if (u.roleId === 3) return false;
        if (u.roleId === 2) return true;
        if (localStorage.getItem('is_driver_' + u.id) === 'true') return false;
        if (localStorage.getItem('is_manager_' + u.id) === 'true') return true;
        
        const emailLower = (u.email || "").toLowerCase();
        const nameLower = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
        
        // Super admin filter
        if (emailLower.includes("admin")) return false; 
        
        // Şoför kelimesi geçiyorsa kesinlikle yöneticiler tablosunda durmasın
        if (emailLower.includes("sofor") || nameLower.includes("şoför")) return false;
        
        // Eğer ehliyet numarası tanımlanmışsa veya plaka tanımlanmışsa bu SÜRÜCÜDÜR.
        if (u.driverLicenseId || u.assignedVehiclePlate || u.driverTripStatus) return false; 
        
        // Geri kalanları (kendisi ve diğer departman yöneticileri vs.) ekranda göster
        return true; 
      });
      
      setData(managersOnly);
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentCompany.id]);

  const openAdd = () => {
    setForm(getInitialForm());
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: ApiUser) => {
    setForm({ ...item, passwordHash: "" }); 
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error("Ad, Soyad ve Email zorunludur");
      return;
    }

    const payload: any = {
      ...form,
      companyId: currentCompany.id,
      roleId: 2, // Şirket Yöneticisi varsayılan rol
      parentManagerId: null // Yöneticilerin üst yöneticisi olmaz
    };

    if (form.passwordHash && form.passwordHash.trim() !== "") {
      payload.passwordHash = form.passwordHash;
    }

    try {
      const method = editItem && editItem.id ? "PUT" : "POST";
      const endpoint = editItem && editItem.id ? `/api/User/${editItem.id}` : `/api/User`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Kaydetme işlemi başarısız");

      // Set explicit frontend flag to prevent leaking into DriversTab due to missing roleId from backend
      try {
        let userId = editItem?.id;
        if (!userId) {
          try {
            const savedUser = await res.clone().json();
            userId = savedUser.id;
          } catch(err) { }
        }
        if (userId) {
           localStorage.setItem(`is_manager_${userId}`, 'true');
           localStorage.removeItem(`is_driver_${userId}`);
        }
      } catch(e) {}

      toast.success(editItem ? "Yönetici güncellendi" : "Yönetici eklendi");
      setShowForm(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !deleteItem.id) return;
    try {
      const res = await fetch(`/api/User/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Silme işlemi başarısız");
      toast.success("Yönetici silindi");
      setDeleteItem(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const columns: Column<ApiUser>[] = [
    { key: "name", header: "Ad Soyad", render: (u) => `${u.firstName || ""} ${u.lastName || ""}` },
    { key: "email", header: "E-posta", render: (u) => <span className="text-blue-600">{u.email}</span> },
    { key: "role", header: "Rol", render: () => <StatusBadge label="Şirket Yöneticisi" variant="info" /> },
    { key: "phone", header: "Telefon", render: (u) => u.phoneNumber || "—" },
    { key: "status", header: "Durum", render: () => <StatusBadge label="Aktif" variant="success" /> },
  ];

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Yöneticiler / İdari Personel</h2>
      <DataTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Yönetici ara..." 
        searchKeys={["firstName", "lastName", "email"]} 
        onAdd={openAdd} 
        addLabel="Yönetici Ekle" 
        onEdit={openEdit} 
        onDelete={(u) => setDeleteItem(u)} 
      />
      
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Yönetici Düzenle" : "Yeni Yönetici"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="İsim *"><Input value={form.firstName || ""} onChange={e => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Soyisim *"><Input value={form.lastName || ""} onChange={e => setForm({ ...form, lastName: e.target.value })} /></Field>
          <Field label="E-posta *"><Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Şifre"><Input type="password" placeholder="***" value={form.passwordHash || ""} onChange={e => setForm({ ...form, passwordHash: e.target.value })} /></Field>
          <Field label="Telefon"><Input value={form.phoneNumber || ""} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></Field>
          <Field label="TC Kimlik No"><Input value={form.tcIdentityNumber || ""} onChange={e => setForm({ ...form, tcIdentityNumber: e.target.value })} /></Field>
          <Field label="Sicil Kaydı"><Input value={form.criminalRecord || ""} onChange={e => setForm({ ...form, criminalRecord: e.target.value })} /></Field>
          <Field label="Rol">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" disabled value="2">
              <option value="2">Şirket Yöneticisi</option>
            </select>
          </Field>
        </div>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Yönetici Sil" message={`"${deleteItem?.firstName} ${deleteItem?.lastName}" adlı yöneticiyi silmek istediğinize emin misiniz?`} />
    </div>
  );
}
