import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
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

import { ApiUser } from "../../manager/tabs/DriversTab";

export function UsersTab() {
  const [data, setData] = useState<ApiUser[]>([]);
  const [editItem, setEditItem] = useState<ApiUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getInitialForm = (): ApiUser => ({
    roleId: 1,
    parentManagerId: null,
    companyId: 1,
    firstName: "",
    lastName: "",
    email: "",
    passwordHash: "",
    phoneNumber: "",
    tcIdentityNumber: "",
    criminalRecord: "",
    driverLicenseId: "",
    driverScore: 100,
    driverTripStatus: "Boşta",
    assignedVehiclePlate: "",
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
      
      const usersList = await usersRes.json();
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
      
      const mergedUsers = usersList.map((u: any) => {
        // Backend'in desteklemediği role, TC, Ehliyet gibi ekstra bilgileri localStorage'dan birleştiriyoruz
        const metaStr = localStorage.getItem(`driver_meta_${u.id}`);
        let roleIdVal = u.roleId !== undefined && u.roleId !== null ? u.roleId : u.role;
        
        // ÖZEL DÜZELTME: Backend veritabanında "3" gibi geçersiz roller atanıyorsa, 
        // veya backend rol dönmüyorsa, KESİNLİKLE LOCALSTORAGE'A GÜVEN!
        if (localStorage.getItem(`is_superadmin_${u.id}`) === 'true') roleIdVal = 0;
        else if (localStorage.getItem(`is_manager_${u.id}`) === 'true') roleIdVal = 1;
        else if (localStorage.getItem(`is_driver_${u.id}`) === 'true') roleIdVal = 2;

        if (metaStr) {
          try {
            const meta = JSON.parse(metaStr);
            return { ...u, ...meta, roleId: roleIdVal }; // meta içinden roleId gelse bile, yukarıdaki güvenli overrides'ı kullanıyoruz
          } catch (e) {}
        }
        
        let merged = { ...u, roleId: roleIdVal };
        const mData = managersMap.get(u.id);
        if (roleIdVal === 1 && mData) {
            merged = { ...merged, ...mData };
        }
        return merged;
      });
      
      setData(mergedUsers);
    } catch (e: any) {
      toast.error(e.message || "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
    // Normalize role as integer for the form's roleId field from both potential props
    const numericRole = item.roleId !== undefined && item.roleId !== null ? Number(item.roleId) : (item as any).role;
    setForm({ ...item, roleId: numericRole, passwordHash: "" });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.email) {
      toast.error("Ad ve E-posta zorunludur");
      return;
    }

    if (!editItem && (!form.passwordHash || form.passwordHash.trim() === "")) {
      toast.error("Yeni kullanıcı eklerken şifre belirlemek zorunludur.");
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
      companyId: form.companyId ? Number(form.companyId) : 1,
      parentManagerId: null, // Backend'de Manager tipindeki veritabanı FK constraint yasağı (500 hatası) fırlatmasını önlüyoruz. LocalStorage kullanacağız.
      role: form.roleId !== null && form.roleId !== undefined ? Number(form.roleId) : 1, // Şirket Yöneticisi varsayılan
      roleId: form.roleId !== null && form.roleId !== undefined ? Number(form.roleId) : 1,
      driverLicenseId: form.driverLicenseId,
      driverScore: form.driverScore,
      driverTripStatus: form.driverTripStatus,
      assignedVehiclePlate: form.assignedVehiclePlate,
      // Yeni payload kuralları gereği, eğer role 1 ise departman bilgilerini payload üzerinden User API yerine Manager API'ye atacağız ama formda tutabiliriz.
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

      try {
        let userId = editItem?.id;
        if (!userId) {
          try {
            const savedUser = await res.clone().json();
            userId = savedUser.id || savedUser.userId;
          } catch(err) { }
        }
        if (userId) {
           const targetRole = Number(form.roleId);
           if (targetRole === 2) { // Sürücü
              localStorage.setItem(`is_driver_${userId}`, 'true');
              localStorage.removeItem(`is_manager_${userId}`);
              localStorage.removeItem(`is_superadmin_${userId}`);
              
              const driverMeta = {
                role: 2,
                roleId: 2,
                tcIdentityNumber: form.tcIdentityNumber,
                driverLicenseId: form.driverLicenseId,
                driverScore: form.driverScore ?? 100,
                criminalRecord: form.criminalRecord,
                assignedVehiclePlate: form.assignedVehiclePlate,
                driverTripStatus: form.driverTripStatus,
                parentManagerId: form.parentManagerId
              };
              localStorage.setItem(`driver_meta_${userId}`, JSON.stringify(driverMeta));
           } else if (targetRole === 0) { // Süper Admin
              localStorage.setItem(`is_superadmin_${userId}`, 'true');
              localStorage.removeItem(`is_manager_${userId}`);
              localStorage.removeItem(`is_driver_${userId}`);
              localStorage.removeItem(`driver_meta_${userId}`);
           } else { // Yöneticileri ve geri kalanları 1 (Manager) say
              localStorage.setItem(`is_manager_${userId}`, 'true');
              localStorage.removeItem(`is_superadmin_${userId}`);
              localStorage.removeItem(`is_driver_${userId}`);
              localStorage.removeItem(`driver_meta_${userId}`);

              // YENİ: Manager API Entegrasyonu (Gerçek Manager Entity oluşturma)
              if (editItem && editItem.managerId) {
                try {
                   await fetch(`/api/v1/managers/${editItem.managerId}`, {
                     method: "PUT",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({
                       userId: userId,
                       departmentName: form.departmentName || "Merkez",
                       officeNumber: form.officeNumber || "101",
                       permissionIds: [0]
                     })
                   });
                } catch(err) { console.error("Manager API PUT err:", err); }
              } else {
                try {
                   await fetch("/api/v1/managers", {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({
                       userId: userId,
                       departmentName: form.departmentName || "Merkez",
                       officeNumber: form.officeNumber || "101",
                       permissionIds: [0]
                     })
                   });
                } catch(err) { console.error("Manager API POST error:", err); }
              }
           }
        }
      } catch(e) {}

      toast.success(editItem ? "Kullanıcı güncellendi" : "Kullanıcı eklendi");
      setShowForm(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !deleteItem.id) return;
    try {
      if (deleteItem.managerId) {
          await fetch(`/api/v1/managers/${deleteItem.managerId}`, { method: 'DELETE' });
      }
      
      const res = await fetch(`/api/User/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Silme işlemi başarısız");
      
      // Temizlik
      localStorage.removeItem(`is_manager_${deleteItem.id}`);
      localStorage.removeItem(`is_driver_${deleteItem.id}`);
      localStorage.removeItem(`driver_meta_${deleteItem.id}`);

      toast.success("Kullanıcı silindi");
      setDeleteItem(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    }
  };

  const columns: Column<ApiUser>[] = [
    { key: "name", header: "Ad Soyad", render: (u) => `${u.firstName || ""} ${u.lastName || ""}` },
    { key: "email", header: "E-posta", render: (u) => <span className="text-blue-600">{u.email}</span> },
    { key: "role", header: "Rol", render: (u) => {
        let label = "Bilinmeyen";
        const roleIdVal = u.roleId !== undefined && u.roleId !== null ? u.roleId : (u as any).role;
        
        if (roleIdVal === 0) label = "Süper Admin";
        else if (roleIdVal === 1) label = "Şirket Yöneticisi";
        else if (roleIdVal === 2) label = "Sürücü";
        else {
          const emailLower = (u.email || "").toLowerCase();
          if (emailLower.includes("admin")) label = "Süper Admin";
          else if (u.driverLicenseId || u.assignedVehiclePlate) label = "Sürücü";
          else label = "Şirket Yöneticisi";
        }
        
        return <StatusBadge label={label} variant="info" />;
      } 
    },
    { key: "status", header: "Durum", render: (u) => {
        const status = u.driverTripStatus || "active";
        return <StatusBadge label={status === "active" ? "Aktif" : "Pasif"} variant={status === "active" ? "success" : "neutral"} />;
      }
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Kullanıcılar (Tümü)</h2>
      <DataTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Kullanıcı ara..." 
        searchKeys={["firstName", "lastName", "email"]} 
        onAdd={openAdd} 
        addLabel="Kullanıcı Ekle" 
        onEdit={openEdit} 
        onDelete={(u) => setDeleteItem(u)} 
      />

      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"} onSubmit={handleSave} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="İsim *"><Input value={form.firstName || ""} onChange={e => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Soyisim"><Input value={form.lastName || ""} onChange={e => setForm({ ...form, lastName: e.target.value })} /></Field>
          <Field label="E-posta *"><Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Şifre"><Input type="password" placeholder="***" value={form.passwordHash || ""} onChange={e => setForm({ ...form, passwordHash: e.target.value })} /></Field>
          <Field label="Telefon"><Input value={form.phoneNumber || ""} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></Field>
          <Field label="Tc (TC Kimlik No)"><Input value={form.tcIdentityNumber || ""} onChange={e => setForm({ ...form, tcIdentityNumber: e.target.value })} /></Field>
          {Number(form.roleId) === 2 && (
            <>
              <Field label="Sicil Kaydı"><Input value={form.criminalRecord || ""} onChange={e => setForm({ ...form, criminalRecord: e.target.value })} /></Field>
              <Field label="Ehliyet No"><Input value={form.driverLicenseId || ""} onChange={e => setForm({ ...form, driverLicenseId: e.target.value })} /></Field>
            </>
          )}
          
          {Number(form.roleId) === 1 && (
            <>
              <Field label="Departman"><Input value={form.departmentName || ""} onChange={e => setForm({ ...form, departmentName: e.target.value })} placeholder="Örn: Operasyon" /></Field>
              <Field label="Ofis/Oda No"><Input value={form.officeNumber || ""} onChange={e => setForm({ ...form, officeNumber: e.target.value })} placeholder="Örn: 201" /></Field>
            </>
          )}
          
          <Field label="Rol">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.roleId ?? 1} onChange={e => setForm({ ...form, roleId: Number(e.target.value) })}>
              <option value="0">Süper Admin</option>
              <option value="1">Şirket Yöneticisi</option>
              <option value="2">Sürücü</option>
            </select>
          </Field>
          <Field label="Şirket ID"><Input type="number" value={form.companyId || ""} onChange={e => setForm({ ...form, companyId: Number(e.target.value) })} /></Field>
          
          {Number(form.roleId) === 2 && (() => {
            const availableManagers = data.filter(u => {
               // İsmi, soyismi ya da e-postası Sistem/Admin olanları kesinlikle ayıkla (Veritabanında manager olarak açılmış olsalar bile)
               const isSuperAdmin = (u.email || "").toLowerCase().includes("admin") || 
                                    (u.firstName || "").toLowerCase().includes("sistem") || 
                                     u.roleId === 0 || (u as any).role === 0;
               return !isSuperAdmin && u.roleId === 1 && (!form.companyId || u.companyId === Number(form.companyId));
            });
            return (
            <>
              <Field label="Bağlı Yönetici">
                <select 
                  className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground" 
                  value={form.parentManagerId != null ? form.parentManagerId.toString() : ""} 
                  onChange={e => setForm({ ...form, parentManagerId: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Yönetici Seçiniz...</option>
                  {availableManagers.map(m => (
                    <option key={m.id} value={m.id?.toString()}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              </Field>
              <Field label="Puan"><Input type="number" value={form.driverScore ?? 100} onChange={e => setForm({ ...form, driverScore: Number(e.target.value) })} /></Field>
              <Field label="Atanan Araç Plakası"><Input value={form.assignedVehiclePlate || ""} onChange={e => setForm({ ...form, assignedVehiclePlate: e.target.value })} /></Field>
              <Field label="Durum">
                <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.driverTripStatus || "Boşta"} onChange={e => setForm({ ...form, driverTripStatus: e.target.value })}>
                  <option value="Boşta">Boşta</option>
                  <option value="Seferde">Seferde</option>
                  <option value="Pasif">Pasif</option>
                </select>
              </Field>
            </>
            );
          })()}
        </div>
      </FormDialog>
      <ConfirmDialog open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} title="Kullanıcı Sil" message={`"${deleteItem?.firstName}" kullanıcısını silmek istediğinize emin misiniz?`} />
    </div>
  );
}
