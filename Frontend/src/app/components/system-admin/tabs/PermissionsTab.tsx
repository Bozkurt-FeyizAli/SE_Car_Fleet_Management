import React, { useState, useEffect } from "react";
import { DataTable, Column } from "../../shared/DataTable";
import { FormDialog, Field, ConfirmDialog } from "../../shared/FormDialog";
import { Input } from "../../ui/input";
import { toast } from "sonner";
import { apiFetch } from "../../../utils/api";

export interface ApiPermission {
  id?: number;
  name: string;
}

export function PermissionsTab() {
  const [data, setData] = useState<ApiPermission[]>([]);
  const [editItem, setEditItem] = useState<ApiPermission | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<ApiPermission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState<ApiPermission>({
    name: "",
  });

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      // Using standard fetch since it might not be under /v1 yet
      const res = await fetch("/api/Permission");
      if (!res.ok) throw new Error("Veriler alınamadı");
      const list = await res.json();
      setData(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error("Yetkiler yüklenemedi: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const openAdd = () => {
    setForm({
      name: "",
    });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: ApiPermission) => {
    setForm({ ...item });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || form.name.trim() === "") {
      toast.error("Yetki adı zorunludur");
      return;
    }

    try {
      const payload = {
        name: form.name.trim()
      };

      const method = editItem && editItem.id ? "PUT" : "POST";
      const endpoint = editItem && editItem.id ? `/api/Permission/${editItem.id}` : `/api/Permission`;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("İşlem başarısız oldu");

      toast.success(editItem ? "Yetki güncellendi" : "Yetki eklendi");
      setShowForm(false);
      fetchPermissions();
    } catch (e: any) {
      toast.error("Kaydetme işlemi başarısız: " + e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !deleteItem.id) return;
    try {
      const res = await fetch(`/api/Permission/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Silme işlemi başarısız");
      
      toast.success("Yetki silindi");
      setDeleteItem(null);
      fetchPermissions();
    } catch (e: any) {
      toast.error("Silme işlemi başarısız: " + e.message);
    }
  };

  const columns: Column<ApiPermission>[] = [
    { key: "id", header: "ID", render: (d) => d.id },
    { key: "name", header: "Yetki Adı", render: (d) => <span className="font-medium text-foreground">{d.name}</span> },
  ];

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold tracking-tight">Sistem Yetkileri</h2>
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6 text-sm text-blue-700 dark:text-blue-300">
        <strong>Bilgi:</strong> Sistemde kullanılabilecek izin (permission) tanımlarını buradan yönetebilirsiniz. Eklenen yetkiler yöneticilere atanırken kullanılacaktır.
      </div>
      
      <DataTable 
        data={data} 
        columns={columns} 
        searchPlaceholder="Yetki ara..." 
        searchKeys={["name"]} 
        onAdd={openAdd} 
        addLabel="Yeni Yetki Ekle" 
        onEdit={openEdit} 
        onDelete={(d) => setDeleteItem(d)} 
      />
      
      <FormDialog open={showForm} onClose={() => setShowForm(false)} title={editItem ? "Yetki Düzenle" : "Yeni Yetki"} onSubmit={handleSave}>
        <div className="space-y-4">
          <Field label="Yetki Adı *">
            <Input 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              placeholder="Örn: RENTALS_APPROVE, MANAGE_USERS"
            />
          </Field>
        </div>
      </FormDialog>
      <ConfirmDialog 
        open={!!deleteItem} 
        onClose={() => setDeleteItem(null)} 
        onConfirm={handleDelete} 
        title="Yetki Sil" 
        message={`"${deleteItem?.name}" adlı yetkiyi silmek istediğinize emin misiniz?`} 
      />
    </div>
  );
}
