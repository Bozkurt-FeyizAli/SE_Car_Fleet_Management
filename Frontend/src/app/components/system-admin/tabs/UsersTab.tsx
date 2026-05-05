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
  const [companies, setCompanies] = useState<any[]>([]);
  const [editItem, setEditItem] = useState<ApiUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);

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
    departmentId: 0,
    departmentName: "Merkez",
    officeNumber: "101",
  });

  const [form, setForm] = useState<ApiUser>(getInitialForm());

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [usersRes, managersRes, companiesRes] = await Promise.all([
        fetch("/api/User"),
        fetch("/api/v1/managers").catch(() => null),
        fetch("/api/v1/companies").catch(() => null)
      ]);
      
      if (!usersRes.ok) throw new Error("Kullanıcılar yüklenemedi");
      
      const usersList = await usersRes.json();
      let managersMap = new Map();
      
      if (managersRes && managersRes.ok) {
         try {
            const mList = await managersRes.json();
            if (Array.isArray(mList)) {
               mList.forEach((m: any) => {
                  managersMap.set(m.userId, { 
                    managerId: m.id, 
                    departmentId: m.departmentId,
                    departmentName: m.departmentName, 
                    officeNumber: m.officeNumber 
                  });
               });
            }
         } catch(e) {}
      }

      if (companiesRes && companiesRes.ok) {
        try {
          const cList = await companiesRes.json();
          setCompanies(Array.isArray(cList) ? cList : []);
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

        let merged = { ...u, roleId: roleIdVal };
        const mData = managersMap.get(u.id);

        if (metaStr) {
          try {
            const meta = JSON.parse(metaStr);
            merged = { ...merged, ...meta, roleId: roleIdVal };
          } catch (e) {}
        }
        
        // Manager verisi (departman, ofis) her zaman en son uygulanır — API kaynağı localStorage'dan daha güncel
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
    fetch("/api/v1/departments")
      .then(res => res.json())
      .then(data => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/Permission")
      .then(res => res.json())
      .then(data => setPermissionsList(Array.isArray(data) ? data : []))
      .catch(() => {});
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
    
    // LocalStorage Fallbacks
    const localTc = localStorage.getItem(`user_tc_${item.id}`);
    const localCriminal = localStorage.getItem(`user_criminal_${item.id}`);
    
    setForm({ 
      ...item, 
      roleId: numericRole, 
      passwordHash: "",
      tcIdentityNumber: item.tcIdentityNumber || localTc || "",
      criminalRecord: item.criminalRecord || localCriminal || ""
    });
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
              localStorage.setItem(`user_tc_${userId}`, form.tcIdentityNumber || "");
              localStorage.setItem(`user_criminal_${userId}`, form.criminalRecord || "");
           }

           // Manager API Güncelleme: Rol 1 (Yönetici) ise her zaman çalışsın
           if (targetRole === 1 && form.departmentName) {
              let resolvedManagerId = editItem?.managerId;
              if (!resolvedManagerId) {
                try {
                  const mListRes = await fetch("/api/v1/managers");
                  if (mListRes.ok) {
                    const mList = await mListRes.json();
                    const found = Array.isArray(mList) ? mList.find((m: any) => m.userId === userId) : null;
                    if (found) resolvedManagerId = found.id;
                  }
                } catch(e) {}
              }

              if (resolvedManagerId) {
                try {
                   const putRes = await fetch(`/api/v1/managers/${resolvedManagerId}`, {
                     method: "PUT",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({
                       userId: userId,
                       departmentId: form.departmentId,
                       departmentName: form.departmentName,
                       officeNumber: form.officeNumber || "101",
                       permissionIds: form.permissionIds && form.permissionIds.length > 0 ? form.permissionIds : []
                     })
                   });
                   if (!putRes.ok) console.error("Manager PUT başarısız:", putRes.status, await putRes.text());
                } catch(err) { console.error("Manager API PUT err:", err); }
              } else {
                try {
                   await fetch("/api/v1/managers", {
                     method: "POST",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({
                       userId: userId,
                       departmentId: form.departmentId,
                       departmentName: form.departmentName,
                       officeNumber: form.officeNumber || "101",
                       permissionIds: []
                     })
                   });
                } catch(err) { console.error("Manager API POST error:", err); }
               }

               // DEPARTMAN BAZLI YETKİ EŞİTLEME — System Admin tüm departmanları değiştirebilir
               const targetPerms = form.permissionIds || [];
               const syncPermsFor = async (mId: number, permsSet: number[]) => {
                 try {
                   const mpR = await fetch(`/api/ManagerPermission?t=${Date.now()}`);
                   if (!mpR.ok) return;
                   const mpL = await mpR.json();
                   const cur = mpL.filter((mp: any) => mp.managerId === mId || mp.ManagerId === mId);
                   const curIds = cur.map((mp: any) => mp.permissionId || mp.PermissionId);
                   const adds = permsSet.filter((id: number) => !curIds.includes(id));
                   const rems = cur.filter((mp: any) => !permsSet.includes(mp.permissionId || mp.PermissionId));
                   const ps: Promise<any>[] = [];
                   for (const id of adds) ps.push(fetch("/api/ManagerPermission", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ managerId: mId, permissionId: id }) }));
                   for (const mp of rems) { const mid2 = mp.id || mp.Id; if (mid2 !== undefined) ps.push(fetch(`/api/ManagerPermission/${mid2}`, { method: "DELETE" })); }
                   await Promise.all(ps);
                 } catch(e) { console.error("Perm sync err:", e); }
               };
               if (resolvedManagerId) await syncPermsFor(resolvedManagerId, targetPerms);
               try {
                 const allMgrs = await fetch("/api/v1/managers").then(r => r.ok ? r.json() : []);
                 const allUsrs = await fetch("/api/User").then(r => r.ok ? r.json() : []);
                 const peers = (Array.isArray(allMgrs) ? allMgrs : []).filter((m: any) => {
                   if (m.id === resolvedManagerId) return false;
                   if (m.departmentName !== form.departmentName) return false;
                   const mu = allUsrs.find((u: any) => u.id === m.userId);
                   return mu && mu.companyId === Number(form.companyId);
                 });
                 if (peers.length > 0) {
                   await Promise.all(peers.map(async (peer: any) => {
                     await fetch(`/api/v1/managers/${peer.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: peer.userId, departmentId: form.departmentId, departmentName: form.departmentName, officeNumber: peer.officeNumber || "101", permissionIds: targetPerms }) }).catch(e => console.error(e));
                     await syncPermsFor(peer.id, targetPerms);
                   }));
                   toast.info(`"${form.departmentName}" departmanındaki ${peers.length} yöneticinin yetkileri de güncellendi.`);
                 }
               } catch(e) { console.error("Dept bulk sync err:", e); }
            }
         }
       } catch(e) { console.error("Post-save error:", e); }

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
        if (status === "Idle" || status === "active" || status === "Boşta") {
          return <StatusBadge label="Aktif" variant="success" />;
        }
        if (status === "InTrip" || status === "on_trip" || status === "Seferde") {
          return <StatusBadge label="Seferde" variant="info" />;
        }
        return <StatusBadge label="Pasif" variant="neutral" />;
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
              <Field label="Departman">
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  value={form.departmentName || ""}
                  onChange={e => {
                    const depName = e.target.value;
                    const depObj = departments.find(d => d.departmentName === depName);
                    const depId = depObj ? depObj.id : 0;
                    setForm({ ...form, departmentId: depId, departmentName: depName });
                  }}
                  disabled={!form.companyId}
                >
                  <option value="">Departman Seçiniz...</option>
                  {departments.filter(d => d.companyId === Number(form.companyId)).map(d => (
                    <option key={d.id} value={d.departmentName}>{d.departmentName}</option>
                  ))}
                </select>
                {!form.companyId && <p className="text-xs text-muted-foreground mt-1">Önce şirket seçmelisiniz.</p>}
              </Field>
              <Field label="Ofis/Oda No"><Input value={form.officeNumber || ""} onChange={e => setForm({ ...form, officeNumber: e.target.value })} placeholder="Örn: 201" /></Field>
              <div className="col-span-1 sm:col-span-2">
                <Field label="Departman Yetkileri">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2 p-3 border rounded-md bg-muted/20">
                    {permissionsList.length > 0 ? permissionsList.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm select-none">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={(form.permissionIds || []).includes(p.id)} 
                          onChange={(e) => {
                            const current = form.permissionIds || [];
                            if (e.target.checked) setForm({ ...form, permissionIds: [...current, p.id] });
                            else setForm({ ...form, permissionIds: current.filter(id => id !== p.id) });
                          }} 
                        />
                        {p.name}
                      </label>
                    )) : <span className="text-muted-foreground text-xs col-span-full">Henüz sistemde kayıtlı yetki bulunmuyor.</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">System Admin tüm departman yetkilerini değiştirebilir. Değişiklikler aynı departmandaki tüm yöneticilere uygulanır.</p>
                </Field>
              </div>
            </>
          )}
          <Field label="Rol">
            <select className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm" value={form.roleId ?? 1} onChange={e => setForm({ ...form, roleId: Number(e.target.value) })}>
              <option value="0">Süper Admin</option>
              <option value="1">Şirket Yöneticisi</option>
              <option value="2">Sürücü</option>
            </select>
          </Field>
          {Number(form.roleId) !== 0 && (
            <Field label="Şirket">
              <select 
                className="w-full h-9 rounded-md border border-border bg-input-background px-3 text-sm text-foreground" 
                value={form.companyId || ""} 
                onChange={e => setForm({ ...form, companyId: Number(e.target.value) })}
              >
                <option value="">Şirket Seçiniz...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                ))}
              </select>
            </Field>
          )}
          
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
