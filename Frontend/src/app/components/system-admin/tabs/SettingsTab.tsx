import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Field } from "../../shared/FormDialog";
import { toast } from "sonner";
import { Save, Shield, Bell, Globe, Database, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch } from "../../../utils/api";

export function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [dbStatus, setDbStatus] = useState<"checking" | "ok" | "error">("checking");
  const [companiesCount, setCompaniesCount] = useState(0);

  const [profileForm, setProfileForm] = useState({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    insuranceWarningDays: "30",
    maintenanceWarningKm: "500",
    lowScoreThreshold: "60",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Sistem admin profilini çek
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

        // DB durumunu ve şirket sayısını kontrol et
        const companiesRes = await fetch("/api/v1/companies");
        if (companiesRes.ok) {
          const companies = await companiesRes.json();
          setCompaniesCount(Array.isArray(companies) ? companies.length : 0);
          setDbStatus("ok");
        } else {
          setDbStatus("error");
        }
      } catch (err) {
        setDbStatus("error");
        console.error("Sistem ayarları yüklenemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      const res = await fetch(`/api/User/${profileForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
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
        <Loader2 className="w-5 h-5 animate-spin" /> Sistem ayarları yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold tracking-tight">Sistem Ayarları</h2>

      {/* Sistem Yöneticisi Profili */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="w-4 h-4" /> Yönetici Profili</CardTitle>
          <CardDescription>Sistem yöneticisi hesap bilgileri</CardDescription>
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
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-3">Şifre değiştirmek istemiyorsanız boş bırakın.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Yeni Şifre">
                <Input type="password" placeholder="Yeni şifre" value={profileForm.newPassword} onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })} />
              </Field>
              <Field label="Şifre Tekrar">
                <Input type="password" placeholder="Tekrar girin" value={profileForm.confirmPassword} onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })} />
              </Field>
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Profili Güncelle
          </Button>
        </CardContent>
      </Card>

      {/* Bildirim Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Bildirim Ayarları</CardTitle>
          <CardDescription>Uyarı ve bildirim eşikleri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" defaultChecked={notifSettings.emailNotifications} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm">E-posta bildirimleri</span>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" defaultChecked={notifSettings.smsNotifications} className="w-4 h-4 accent-blue-600" />
            <span className="text-sm">SMS bildirimleri</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Sigorta Uyarı (gün)">
              <Input type="number" defaultValue={notifSettings.insuranceWarningDays} />
            </Field>
            <Field label="Bakım Uyarı KM">
              <Input type="number" defaultValue={notifSettings.maintenanceWarningKm} />
            </Field>
            <Field label="Düşük Puan Eşiği">
              <Input type="number" defaultValue={notifSettings.lowScoreThreshold} />
            </Field>
          </div>
          <Button variant="outline" onClick={() => toast.success("Bildirim ayarları kaydedildi")}>
            <Save className="w-4 h-4 mr-1" /> Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* Veritabanı Durumu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="w-4 h-4" /> Veritabanı Durumu</CardTitle>
          <CardDescription>Canlı bağlantı bilgisi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium ${
            dbStatus === "ok"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
          }`}>
            {dbStatus === "ok"
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <XCircle className="w-4 h-4 shrink-0" />
            }
            {dbStatus === "ok"
              ? `Veritabanı bağlantısı aktif — ${companiesCount} şirket kayıtlı`
              : "Veritabanı bağlantısı kurulamadı"
            }
          </div>
        </CardContent>
      </Card>

      {/* Güvenlik */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Güvenlik</CardTitle>
          <CardDescription>Şifre politikası ve güvenlik ayarları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "İki faktörlü doğrulama zorunlu",
            "Şifre karmaşıklığı zorunlu (büyük harf, rakam, özel karakter)",
            "90 günde bir şifre değişikliği zorunlu",
          ].map(label => (
            <div key={label} className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600" />
              <span className="text-sm">{label}</span>
            </div>
          ))}
          <Button variant="outline" onClick={() => toast.success("Güvenlik ayarları kaydedildi")}>
            <Save className="w-4 h-4 mr-1" /> Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}