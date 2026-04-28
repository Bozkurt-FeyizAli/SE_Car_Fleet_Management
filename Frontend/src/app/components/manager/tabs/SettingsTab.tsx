import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Field } from "../../shared/FormDialog";
import { toast } from "sonner";
import { Save, Building2, Bell, Users, Loader2 } from "lucide-react";
import { currentCompany } from "../ManagerPanel";
import { apiFetch } from "../../../utils/api";

export function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    id: 0,
    companyName: "",
    email: "",
    phoneNumber: "",
    address: "",
    website: "",
    taxNumber: "",
  });

  const [profileForm, setProfileForm] = useState({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Şirket bilgilerini çek
        const companiesRes = await fetch("/api/v1/companies");
        if (companiesRes.ok) {
          const companies: any[] = await companiesRes.json();
          const myCompany = companies.find((c: any) => c.id === currentCompany.id);
          if (myCompany) {
            setCompanyForm({
              id: myCompany.id,
              companyName: myCompany.companyName || myCompany.name || "",
              email: myCompany.email || "",
              phoneNumber: myCompany.phoneNumber || myCompany.phone || "",
              address: myCompany.address || "",
              website: myCompany.website || "",
              taxNumber: myCompany.taxNumber || "",
            });
          }
        }

        // Giriş yapan yöneticinin profil bilgilerini çek
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          const usersRes = await fetch("/api/User");
          if (usersRes.ok) {
            const users: any[] = await usersRes.json();
            const me = users.find((u: any) => u.email === parsed.email);
            if (me) {
              setProfileForm(prev => ({
                ...prev,
                id: me.id,
                firstName: me.firstName || "",
                lastName: me.lastName || "",
                email: me.email || "",
                phoneNumber: me.phoneNumber || "",
              }));
            }
          }
        }
      } catch (err) {
        console.error("Ayarlar yüklenemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await apiFetch(`/v1/companies/${companyForm.id}`, {
        method: "PUT",
        body: JSON.stringify({
          companyName: companyForm.companyName,
          email: companyForm.email,
          phoneNumber: companyForm.phoneNumber,
          address: companyForm.address,
          website: companyForm.website,
          taxNumber: companyForm.taxNumber,
        }),
      });
      toast.success("Şirket bilgileri güncellendi.");
    } catch (err: any) {
      toast.error("Kaydedilemedi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    setSavingProfile(true);
    try {
      const payload: any = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
      };
      if (profileForm.newPassword) {
        payload.password = profileForm.newPassword;
      }
      await fetch(`/api/User/${profileForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Profil bilgileri güncellendi.");
      setProfileForm(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
    } catch (err: any) {
      toast.error("Profil kaydedilemedi: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Ayarlar yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold tracking-tight">Ayarlar</h2>

      {/* Şirket Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Şirket Bilgileri</CardTitle>
          <CardDescription>Şirketinizin genel bilgilerini güncelleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Şirket Adı">
              <Input value={companyForm.companyName} onChange={e => setCompanyForm({ ...companyForm, companyName: e.target.value })} />
            </Field>
            <Field label="Vergi Numarası">
              <Input value={companyForm.taxNumber} onChange={e => setCompanyForm({ ...companyForm, taxNumber: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="E-posta">
              <Input type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} />
            </Field>
            <Field label="Telefon">
              <Input value={companyForm.phoneNumber} onChange={e => setCompanyForm({ ...companyForm, phoneNumber: e.target.value })} />
            </Field>
          </div>
          <Field label="Adres">
            <Input value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} />
          </Field>
          <Field label="Website">
            <Input value={companyForm.website} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} placeholder="https://..." />
          </Field>
          <Button onClick={handleSaveCompany} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* Profil Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Profil Ayarları</CardTitle>
          <CardDescription>Kendi hesap bilgilerinizi güncelleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ad">
              <Input value={profileForm.firstName} onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })} />
            </Field>
            <Field label="Soyad">
              <Input value={profileForm.lastName} onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="E-posta">
              <Input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} />
            </Field>
            <Field label="Telefon">
              <Input value={profileForm.phoneNumber} onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} />
            </Field>
          </div>
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs text-muted-foreground">Şifreyi değiştirmek istemiyorsanız boş bırakın.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Yeni Şifre">
                <Input type="password" placeholder="Yeni şifre" value={profileForm.newPassword} onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })} />
              </Field>
              <Field label="Şifre Tekrar">
                <Input type="password" placeholder="Şifreyi tekrar girin" value={profileForm.confirmPassword} onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} />
              </Field>
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Profili Güncelle
          </Button>
        </CardContent>
      </Card>

      {/* Bildirim Tercihleri - frontend only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Bildirim Tercihleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Sefer bildirimleri",
            "Ödeme bildirimleri",
            "Araç sigorta/kasko uyarıları",
            "Şoför puan uyarıları",
          ].map(label => (
            <div key={label} className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600" />
              <span className="text-sm">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <input type="checkbox" className="w-4 h-4 accent-blue-600" />
            <span className="text-sm">SMS bildirimleri</span>
          </div>
          <Button variant="outline" onClick={() => toast.success("Bildirim tercihleri kaydedildi")}>
            <Save className="w-4 h-4 mr-1" /> Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
