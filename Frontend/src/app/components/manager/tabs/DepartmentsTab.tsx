import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { currentCompany } from "../ManagerPanel";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";

export interface ApiDepartment {
  id?: number;
  companyId: number;
  departmentName: string;
}

export function DepartmentsTab() {
  const [data, setData] = useState<ApiDepartment[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(currentCompany.id || 1);
  const [userRole, setUserRole] = useState<number>(1);
  const [editItem, setEditItem] = useState<ApiDepartment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiDepartment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState<ApiDepartment>({
    companyId: currentCompany.id,
    departmentName: "",
  });

  const fetchDepartments = async (compId: number) => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/v1/departments/company/${compId}`);
      setData(Array.isArray(res) ? res : (res?.data || []));
    } catch (e: any) {
      toast.error("Departmanlar yüklenemedi: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await apiFetch("/v1/companies");
      const compList = Array.isArray(res) ? res : (res?.data || []);
      setCompanies(compList);
      if (compList.length > 0 && (!selectedCompanyId || selectedCompanyId === 1)) {
         setSelectedCompanyId(compList[0].id);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const role = user?.role !== undefined ? user.role : 1;
    setUserRole(role);

    if (role === 0) {
       fetchCompanies();
    }
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
       fetchDepartments(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const openAdd = () => {
    setForm({
      companyId: selectedCompanyId,
      departmentName: "",
    });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: ApiDepartment) => {
    setForm({ ...item });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.departmentName || form.departmentName.trim() === "") {
      toast.error("Departman adı zorunludur");
      return;
    }

    try {
      const payload = {
        companyId: form.companyId,
        departmentName: form.departmentName.trim()
      };

      if (editItem && editItem.id) {
        await apiFetch(`/v1/departments/${editItem.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        toast.success("Departman güncellendi");
      } else {
        await apiFetch(`/v1/departments`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        toast.success("Departman eklendi");
      }

      setShowForm(false);
      fetchDepartments(selectedCompanyId);
    } catch (e: any) {
      toast.error("Kaydetme işlemi başarısız: " + e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !deleteItem.id) return;
    try {
      await apiFetch(`/v1/departments/${deleteItem.id}`, { method: 'DELETE' });
      toast.success("Departman silindi");
      setDeleteItem(null);
      fetchDepartments(selectedCompanyId);
    } catch (e: any) {
      toast.error("Silme işlemi başarısız: " + e.message);
    }
  };

  const columns: Column<ApiDepartment>[] = [
    { key: "id", header: "ID", render: (d) => d.id },
    { key: "departmentName", header: "Departman Adı", render: (d) => <span className="font-medium text-foreground">{d.departmentName}</span> },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Şirket Departmanları</h2>
        
        {userRole === 0 && (
          <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-lg border border-border">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap pl-2">Şirket Seçin:</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-48 sm:w-64"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6 text-sm text-blue-700 dark:text-blue-300">
        <strong>Bilgi:</strong> Burada oluşturulan departmanlar, yeni yönetici eklenirken açılır listede (dropdown) görünür. Eğer bir departmana bağlı yönetici varsa, o departmanı silemezsiniz.
      </div>
      <DataTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Departman ara..." 
        searchKeys={["departmentName"]} 
        onAdd={openAdd} 
        addLabel="Yeni Departman Ekle" 
        onEdit={openEdit} 
        onDelete={(d) => setDeleteItem(d)} 
      />
      
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Departman Düzenle" : "Yeni Departman"} onSubmit={handleSave}>
        <div className="space-y-4">
          {userRole === 0 && (
            <Field label="İlgili Şirket *">
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.companyId}
                onChange={e => setForm({ ...form, companyId: Number(e.target.value) })}
                disabled={!!editItem} // Düzenlerken şirketi değiştirmesini istemeyiz
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Departman Adı *">
            <Input 
              value={form.departmentName} 
              onChange={e => setForm({ ...form, departmentName: e.target.value })} 
              placeholder="Örn: Lojistik, İnsan Kaynakları, Operasyon"
            />
          </Field>
        </div>
      </FormDialog>
      <ConfirmDialog 
        open={!!deleteItem} 
        onClose={() => setDeleteItem(null)} 
        onConfirm={handleDelete} 
        title="Departman Sil" 
        message={`"${deleteItem?.departmentName}" adlı departmanı silmek istediğinize emin misiniz? (Bu departmana bağlı yönetici varsa hata alabilirsiniz)`} 
      />
    </div>
  );
}
