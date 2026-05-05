import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { StatusBadge } from "../../shared/StatusBadge";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";

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
  const [departments, setDepartments] = useState<any[]>([]);
  const [permissionsList, setPermissionsList] = useState<any[]>([]);

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
    departmentId: 0,
    departmentName: "",
    officeNumber: "101",
    permissionIds: [],
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
    apiFetch(`/v1/departments/company/${currentCompany.id}`)
      .then(res => setDepartments(Array.isArray(res) ? res : res?.data || []))
      .catch(() => {});
      
    fetch("/api/Permission")
      .then(res => res.json())
      .then(data => setPermissionsList(Array.isArray(data) ? data : []))
      .catch(() => {});
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

  const openEdit = async (item: ApiUser) => {
    const localTc = localStorage.getItem(`user_tc_${item.id}`);
    const localCriminal = localStorage.getItem(`user_criminal_${item.id}`);
    
    let perms: number[] = [];
    if (item.managerId) {
      try {
        const mpRes = await fetch(`/api/ManagerPermission?t=${Date.now()}`);
        if (mpRes.ok) {
           const mpList = await mpRes.json();
           perms = mpList.filter((mp: any) => mp.managerId === item.managerId || mp.ManagerId === item.managerId).map((mp: any) => mp.permissionId || mp.PermissionId);
        }
      } catch(e) {}
    } else if (item.departmentName) {
      const peer = data.find(u => u.roleId === 1 && u.departmentName === item.departmentName && u.managerId && u.id !== item.id);
      if (peer && peer.managerId) {
         try {
           const mpRes = await fetch(`/api/ManagerPermission?t=${Date.now()}`);
           if (mpRes.ok) {
              const mpList = await mpRes.json();
              perms = mpList.filter((mp: any) => mp.managerId === peer.managerId || mp.ManagerId === peer.managerId).map((mp: any) => mp.permissionId || mp.PermissionId);
           }
         } catch(e) {}
      }
    }

    setForm({ 
      ...item, 
      passwordHash: "",
      tcIdentityNumber: item.tcIdentityNumber || localTc || "",
      criminalRecord: item.criminalRecord || localCriminal || "",
      permissionIds: perms
    }); 
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
           localStorage.setItem(`user_tc_${userId}`, form.tcIdentityNumber || "");
           localStorage.setItem(`user_criminal_${userId}`, form.criminalRecord || "");

           // YENİ: Manager API Entegrasyonu (Gerçek Manager Entity oluşturma/güncelleme)
           if (editItem && editItem.managerId) {
             // PUT /api/v1/managers/{id}
             try {
                await fetch(`/api/v1/managers/${editItem.managerId}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                   body: JSON.stringify({
                    userId: userId,
                    departmentId: form.departmentId,
                    departmentName: form.departmentName || "Yönetim",
                    officeNumber: form.officeNumber || "Yönetim",
                    permissionIds: form.permissionIds && form.permissionIds.length > 0 ? form.permissionIds : []
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
                    departmentId: form.departmentId,
                    departmentName: form.departmentName || "Yönetim",
                    officeNumber: form.officeNumber || "Yönetim",
                    permissionIds: form.permissionIds && form.permissionIds.length > 0 ? form.permissionIds : []
                  })
                });
             } catch(err) { console.error("Manager Create API error:", err); }
           }

           // ManagerPermission API İLE KESİN KAYIT VE EŞİTLEME (DEPARTMAN BAZLI)
            const targetPerms = form.permissionIds || [];
            
            // Tek bir yöneticinin yetkilerini belirtilen sete eşitleyen yardımcı fonksiyon
            const syncPermissionsForManager = async (mId: number, permsToSet: number[]) => {
                try {
                   const mpRes = await fetch(`/api/ManagerPermission?t=${Date.now()}`);
                   if (!mpRes.ok) return;
                   const mpList = await mpRes.json();
                   
                   const currentMappings = mpList.filter((mp: any) => mp.managerId === mId || mp.ManagerId === mId);
                   const currentPermIds = currentMappings.map((mp: any) => mp.permissionId || mp.PermissionId);
                   
                   const toAdd = permsToSet.filter(id => !currentPermIds.includes(id));
                   const toRemove = currentMappings.filter((mp: any) => {
                       const pId = mp.permissionId || mp.PermissionId;
                       return !permsToSet.includes(pId);
                   });
                   
                   const promises: Promise<any>[] = [];
                   for (const id of toAdd) {
                       promises.push(fetch(`/api/ManagerPermission`, {
                           method: "POST",
                           headers: { "Content-Type": "application/json" },
                           body: JSON.stringify({ managerId: mId, permissionId: id })
                       }));
                   }
                   for (const mapping of toRemove) {
                       const mapId = mapping.id || mapping.Id;
                       if (mapId !== undefined) {
                           promises.push(fetch(`/api/ManagerPermission/${mapId}`, {
                               method: "DELETE"
                           }));
                       }
                   }
                   await Promise.all(promises);
                } catch(e) { console.error("Permission sync error:", e); }
            };

            // Kendi managerId'sini bul (yeni eklenenlerde de)
            let currentManagerId = editItem?.managerId;
            if (!currentManagerId) {
                try {
                   const fetchMgrs = await fetch("/api/v1/managers");
                   if (fetchMgrs.ok) {
                       const mList = await fetchMgrs.json();
                       const found = mList.find((m: any) => m.userId === userId);
                       if (found) currentManagerId = found.id;
                   }
                } catch(e) {}
            }

            // Önce kendi yetkilerini güncelle
            if (currentManagerId) {
                await syncPermissionsForManager(currentManagerId, targetPerms);
            }

            // DEPARTMAN BAZLI YETKİ EŞİTLEME (Bulk Update)
            // Bir departmandaki birine yetki verdiğimizde/aldığımızda, o departmandaki TÜM yöneticilere aynı yetki seti uygulanır.
            // Aynı şekilde yetki çıkarıldığında da departmandaki herkesten çıkar.
            if (form.departmentName) {
              // Güncel manager listesini API'den çek (state eski olabilir)
              let allManagersFresh: any[] = [];
              try {
                 const freshMgrsRes = await fetch("/api/v1/managers");
                 if (freshMgrsRes.ok) allManagersFresh = await freshMgrsRes.json();
              } catch(e) {}

              // Aynı şirketteki, aynı departmandaki diğer yöneticileri bul
              const usersRes2 = await fetch("/api/User");
              let usersList2: any[] = [];
              if (usersRes2.ok) usersList2 = await usersRes2.json();

              const peerManagers = allManagersFresh.filter((m: any) => {
                 if (m.id === currentManagerId) return false;
                 if (m.departmentName !== form.departmentName) return false;
                 const mUser = usersList2.find((u: any) => u.id === m.userId);
                 return mUser && mUser.companyId === currentCompany.id;
              });

              if (peerManagers.length > 0) {
                 const updatePromises = peerManagers.map(async (peer: any) => {
                    // Manager API ile yetki güncelleme
                    await fetch(`/api/v1/managers/${peer.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: peer.userId,
                        departmentId: form.departmentId,
                        departmentName: form.departmentName,
                        officeNumber: peer.officeNumber || "101",
                        permissionIds: targetPerms
                      })
                    }).catch(err => console.error("Peer manager update error:", err));
                    
                    // ManagerPermission tablosunu da eşitle
                    await syncPermissionsForManager(peer.id, targetPerms);
                 });
                 await Promise.all(updatePromises);
                 toast.info(`Departman yetkileri "${form.departmentName}" departmanındaki ${peerManagers.length} yöneticiye de uygulandı.`);
              }
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

  // ──────────────────────────────── GENEL DEPARTMAN İŞ MANTIĞI ────────────────────────────────
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isSystemAdmin = currentUser?.role === 0;
  
  // Şu an sistemi kullanan yöneticinin departmanı "Genel" mi?
  const currentManagerItem = data.find(u => u.id === currentUser?.id || u.userId === currentUser?.id || u.id === currentUser?.userId);
  const isCurrentUserGenel = currentManagerItem?.departmentName?.toLowerCase() === "genel" || currentManagerItem?.departmentName?.toLowerCase() === "general";
  
  // Düzenlenen kişi "Genel" departmanındaysa
  const isEditItemGenel = editItem?.departmentName?.toLowerCase() === "genel" || editItem?.departmentName?.toLowerCase() === "general";
  
  // KURAL: System Admin herkesin departmanını değiştirebilir.
  // Genel yönetici ise sadece system admin departmanını değiştirebilir.
  // Genel yöneticiler, genel olmayan yöneticilerin departmanlarını genel HARİCİ departmanlara değiştirebilir.
  // Genel olmayan normal yöneticiler ise başka yöneticinin departmanını değiştiremez.
  const canChangeDepartment = isSystemAdmin ? true : (isCurrentUserGenel && !isEditItemGenel);
  const disableDepartmentSelect = !!(editItem && !canChangeDepartment);

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
          <Field label="Departman">
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              value={form.departmentName || ""}
              onChange={async e => {
                const depName = e.target.value;
                const depObj = departments.find(d => d.departmentName === depName);
                const depId = depObj ? depObj.id : 0;
                
                // Seçilen yeni departmanın yetkilerini otomatik olarak mevcut form yetkileriyle eşitle (başka yöneticiden okuyarak)
                let newPerms = form.permissionIds;
                if (depName) {
                   const peer = data.find(u => u.roleId === 1 && u.departmentName === depName && u.managerId && u.id !== editItem?.id);
                   if (peer && peer.managerId) {
                      try {
                        const mpRes = await fetch(`/api/ManagerPermission?t=${Date.now()}`);
                        if (mpRes.ok) {
                           const mpList = await mpRes.json();
                           newPerms = mpList.filter((mp: any) => mp.managerId === peer.managerId || mp.ManagerId === peer.managerId).map((mp: any) => mp.permissionId || mp.PermissionId);
                        }
                      } catch(err) {}
                   }
                }
                
                setForm({ ...form, departmentId: depId, departmentName: depName, permissionIds: newPerms });
              }}
              disabled={disableDepartmentSelect}
            >
              <option value="">Departman Seçiniz...</option>
              {departments.map(d => {
                // Genel yöneticiler, diğer yöneticileri "Genel" departmanına ATAYAMAZ (sadece Sys Admin atayabilir)
                const isOptionGenel = d.departmentName.toLowerCase() === "genel" || d.departmentName.toLowerCase() === "general";
                if (!isSystemAdmin && isOptionGenel && form.departmentName !== d.departmentName) return null;
                return (
                  <option key={d.id} value={d.departmentName}>{d.departmentName}</option>
                );
              })}
            </select>
            {disableDepartmentSelect && isEditItemGenel && <p className="text-xs text-red-500 mt-1">Genel yöneticinin departmanını sadece Sistem Yöneticisi değiştirebilir.</p>}
            {disableDepartmentSelect && !isEditItemGenel && !isCurrentUserGenel && <p className="text-xs text-amber-500 mt-1">Departman değişikliği için Genel Yönetici veya Sistem Yöneticisi yetkisi gereklidir.</p>}
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
            </Field>
          </div>
          
          <Field label="Sicil Kaydı">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={form.criminalRecord || ""}
              onChange={e => setForm({ ...form, criminalRecord: e.target.value })}
            >
              <option value="">Seçiniz...</option>
              <option value="Temiz">Temiz</option>
              <option value="Sicilli">Sicilli</option>
            </select>
          </Field>
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
