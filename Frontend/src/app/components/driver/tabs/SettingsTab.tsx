import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Field } from "../../shared/FormDialog";
import { toast } from "sonner";
import { Save, User, Bell, Shield, Loader2 } from "lucide-react";
import { apiFetch } from "../../../utils/api";

export function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    tcIdentityNumber: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const parsed = JSON.parse(storedUser);

        const [usersRes, driversRes] = await Promise.all([
          fetch("/api/User"),
          fetch("/api/Drivers"),
        ]);

        if (usersRes.ok) {
          const users: any[] = await usersRes.json();
          const me = users.find((u: any) => u.email === parsed.email);
          if (me) {
            // Şoför kaydından ek bilgiler
            let driverExtra: any = {};
            if (driversRes.ok) {
              const drivers: any[] = await driversRes.json();
              const myDriver = drivers.find((d: any) => d.userId === me.id);
              if (myDriver) {
                driverExtra = { tcIdentityNumber: myDriver.tcIdentityNumber || me.tcIdentityNumber || "" };
              }
            }
            setProfileForm(prev => ({
              ...prev,
              id: me.id,
              firstName: me.firstName || "",
              lastName: me.lastName || "",
              email: me.email || "",
              phoneNumber: me.phoneNumber || "",
              tcIdentityNumber: driverExtra.tcIdentityNumber || me.tcIdentityNumber || "",
            }));
          }
        }
      } catch (err) {
        console.error("Profil yüklenemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    setSaving(true);
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
      setSaving(false);
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

      {/* Profil Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-4 h-4" /> Profil Bilgileri</CardTitle>
          <CardDescription>Kişisel bilgilerinizi güncelleyin</CardDescription>
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
          {profileForm.tcIdentityNumber && (
            <Field label="TC Kimlik No">
              <Input value={profileForm.tcIdentityNumber} readOnly className="bg-muted text-muted-foreground" />
            </Field>
          )}
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Profili Güncelle
          </Button>
        </CardContent>
      </Card>

      {/* Şifre Değiştir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Yeni Şifre">
              <Input
                type="password"
                placeholder="Yeni şifreniz"
                value={profileForm.newPassword}
                onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })}
              />
            </Field>
            <Field label="Şifre Tekrar">
              <Input
                type="password"
                placeholder="Şifreyi tekrar girin"
                value={profileForm.confirmPassword}
                onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
              />
            </Field>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving || !profileForm.newPassword}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Şifreyi Değiştir
          </Button>
        </CardContent>
      </Card>

      {/* Bildirim Tercihleri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Bildirim Tercihleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Sefer bildirimleri",
            "Bakım hatırlatmaları",
            "Puan güncelleme bildirimleri",
            "Belge geçerlilik uyarıları",
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

      {/* Uygulama Bilgisi */}
      <Card>
        <CardHeader>
          <CardTitle>Uygulama Bilgisi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Filo Yönetim Sistemi — Şoför Uygulaması</p>
            <p>Versiyon: 1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}