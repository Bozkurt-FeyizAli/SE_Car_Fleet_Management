import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";

// --- GERÇEKÇİ RASTGELE VERİ ÜRETEÇLERİ ---
export const generateTCNo = () => {
  let digits = [];
  digits[0] = Math.floor(Math.random() * 9) + 1;
  for (let i = 1; i < 9; i++) digits[i] = Math.floor(Math.random() * 10);
  let oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  let evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  digits[9] = (oddSum * 7 - evenSum) % 10;
  let totalSum = 0;
  for (let i = 0; i < 10; i++) totalSum += digits[i];
  digits[10] = totalSum % 10;
  return digits.join("");
};

export const generatePhone = () => {
  const providers = ["532", "533", "542", "544", "505", "506", "555"];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  const mid = Math.floor(100 + Math.random() * 899);
  const end1 = Math.floor(10 + Math.random() * 89);
  const end2 = Math.floor(10 + Math.random() * 89);
  return `0${provider} ${mid} ${end1} ${end2}`;
};
// ------------------------------------------

import { ApiUser } from "./DriversTab";

export function UsersTab() {
  const [data, setData] = useState<ApiUser[]>([]);
  const [editItem, setEditItem] = useState<ApiUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getInitialForm = (): ApiUser => ({
    roleId: 1, // Şirket Yöneticisi varsayılan
    parentManagerId: null,
    companyId: currentCompany.id,
    firstName: "",
    lastName: "",
    email: "",
    passwordHash: "",
    phoneNumber: "",
    tcIdentityNumber: "",
    criminalRecord: "",
    departmentName: "Merkez",
    officeNumber: "101",
  });

  const [form, setForm] = useState<ApiUser>(getInitialForm());

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [usersRes, managersRes] = await Promise.all([
        fetch("/api/User"),
        fetch("/api/v1/managers").catch(() => null)
      ]);
      
      if (!usersRes.ok) throw new Error("Kullanıcılar yüklenemedi");
      
      const usersList: any[] = await usersRes.json();
      let managersMap = new Map();
      
      if (managersRes && managersRes.ok) {
         try {
            const mList = await managersRes.json();
            if (Array.isArray(mList)) {
               mList.forEach((m: any) => {
                  managersMap.set(m.userId, { managerId: m.id, departmentName: m.departmentName, officeNumber: m.officeNumber });
               });
            }
         } catch(e) {}
      }
      
      const managersOnly = usersList.filter((u: any) => {
        if (u.companyId !== currentCompany.id) return false;
        const roleIdVal = u.roleId !== undefined && u.roleId !== null ? u.roleId : u.role;
        return roleIdVal === 1; // Şirket Yöneticisi
      }).map((u: any) => {
         const mData = managersMap.get(u.id);
         if (mData) {
            return { ...u, ...mData };
         }
         return u;
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
    setForm({
      ...getInitialForm(),
      tcIdentityNumber: generateTCNo(),
      phoneNumber: generatePhone(),
    });
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

    if (!editItem && (!form.passwordHash || form.passwordHash.trim() === "")) {
      toast.error("Yeni yönetici eklerken şifre belirlemek zorunludur.");
      return;
    }

    // Sistem genelinde isim ve soyisim tekilliği kontrolü
    try {
      const allUsersRes = await fetch("/api/User", { cache: "no-store" });
      if (allUsersRes.ok) {
        const allUsers = await allUsersRes.json();
        const duplicate = allUsers.find((u: any) => 
          u.firstName?.toLowerCase().trim() === form.firstName?.toLowerCase().trim() &&
          u.lastName?.toLowerCase().trim() === form.lastName?.toLowerCase().trim() &&
          (!editItem || u.id !== editItem.id)
        );
        if (duplicate) {
           toast.error("Bu isim ve soyisimde bir kişi sistemde zaten kayıtlı. Farklı şirketlerde olsalar bile aynı ismi kullanamazsınız.");
           return;
        }
      }
    } catch (e) {
      console.error("User uniqueness check failed", e);
    }

    const payload: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phoneNumber: form.phoneNumber,
      tcIdentityNumber: form.tcIdentityNumber,
      criminalRecord: form.criminalRecord,
      companyId: currentCompany.id,
      role: 1, // Şirket Yöneticisi varsayılan rol
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

           // YENİ: Manager API Entegrasyonu (Gerçek Manager Entity oluşturma/güncelleme)
           if (editItem && editItem.managerId) {
             // PUT /api/v1/managers/{id}
             try {
                await fetch(`/api/v1/managers/${editItem.managerId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: userId,
                    departmentName: form.departmentName || "Merkez",
                    officeNumber: form.officeNumber || "Yönetim",
                    permissionIds: [0]
                  })
                });
             } catch(err) { console.error("Manager Update API error:", err); }
           } else {
             // POST /api/v1/managers
             try {
                await fetch("/api/v1/managers", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: userId,
                    departmentName: form.departmentName || "Merkez",
                    officeNumber: form.officeNumber || "Yönetim",
                    permissionIds: [0]
                  })
                });
             } catch(err) { console.error("Manager Create API error:", err); }
           }
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
      // Önce Manager siliyoruz (Eğer manager id'si varsa)
      if (deleteItem.managerId) {
         await fetch(`/api/v1/managers/${deleteItem.managerId}`, { method: 'DELETE' });
      }
      
      // Sonra ana User kaydı silinir
      const res = await fetch(`/api/User/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Silme işlemi başarısız");
      
      // Bayrakları temizle
      localStorage.removeItem(`is_manager_${deleteItem.id}`);
      localStorage.removeItem(`is_driver_${deleteItem.id}`);
      
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
    { key: "department", header: "Departman / Ofis", render: (u) => `${u.departmentName || "Merkez"} - ${u.officeNumber || "101"}` },
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
          <Field label="Departman"><Input value={form.departmentName || ""} onChange={e => setForm({ ...form, departmentName: e.target.value })} placeholder="Örn: Operasyon" /></Field>
          <Field label="Ofis/Oda No"><Input value={form.officeNumber || ""} onChange={e => setForm({ ...form, officeNumber: e.target.value })} placeholder="Örn: 201" /></Field>
          <Field label="Sicil Kaydı"><Input value={form.criminalRecord || ""} onChange={e => setForm({ ...form, criminalRecord: e.target.value })} /></Field>
          <Field label="Rol">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" disabled value="1">
              <option value="1">Şirket Yöneticisi</option>
            </select>
          </Field>
        </div>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Yönetici Sil" message={`"${deleteItem?.firstName} ${deleteItem?.lastName}" adlı yöneticiyi silmek istediğinize emin misiniz?`} />
    </div>
  );
}
