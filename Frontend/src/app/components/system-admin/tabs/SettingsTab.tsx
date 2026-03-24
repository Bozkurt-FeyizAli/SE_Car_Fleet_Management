import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Field } from "../../shared/FormDialog";
import { toast } from "sonner";
import { Save, Shield, Bell, Globe, Database } from "lucide-react";

export function SettingsTab() {
  const [generalSettings, setGeneralSettings] = useState({
    systemName: "Filo Yonetim Sistemi",
    adminEmail: "admin@system.com",
    supportEmail: "destek@system.com",
    defaultLanguage: "tr",
    maxLoginAttempts: "5",
    sessionTimeout: "30",
  });

  const [notifSettings, setNotifSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    insuranceWarningDays: "30",
    maintenanceWarningKm: "5000",
    lowScoreThreshold: "60",
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h2>Sistem Ayarlari</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="w-4 h-4" /> Genel Ayarlar</CardTitle>
          <CardDescription>Sistemin temel yapilandirma ayarlari</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Sistem Adi"><Input value={generalSettings.systemName} onChange={e => setGeneralSettings({ ...generalSettings, systemName: e.target.value })} /></Field>
          <Field label="Admin E-posta"><Input type="email" value={generalSettings.adminEmail} onChange={e => setGeneralSettings({ ...generalSettings, adminEmail: e.target.value })} /></Field>
          <Field label="Destek E-posta"><Input type="email" value={generalSettings.supportEmail} onChange={e => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Maks. Giris Denemesi"><Input type="number" value={generalSettings.maxLoginAttempts} onChange={e => setGeneralSettings({ ...generalSettings, maxLoginAttempts: e.target.value })} /></Field>
            <Field label="Oturum Suresi (dk)"><Input type="number" value={generalSettings.sessionTimeout} onChange={e => setGeneralSettings({ ...generalSettings, sessionTimeout: e.target.value })} /></Field>
          </div>
          <Button onClick={() => toast.success("Genel ayarlar kaydedildi")}><Save className="w-4 h-4" /> Kaydet</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Bildirim Ayarlari</CardTitle>
          <CardDescription>Uyari ve bildirim esikleri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={notifSettings.emailNotifications} onChange={e => setNotifSettings({ ...notifSettings, emailNotifications: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm">E-posta bildirimleri</span>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={notifSettings.smsNotifications} onChange={e => setNotifSettings({ ...notifSettings, smsNotifications: e.target.checked })} className="w-4 h-4" />
            <span className="text-sm">SMS bildirimleri</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Sigorta Uyari Suresi (gun)"><Input type="number" value={notifSettings.insuranceWarningDays} onChange={e => setNotifSettings({ ...notifSettings, insuranceWarningDays: e.target.value })} /></Field>
            <Field label="Bakim Uyari KM"><Input type="number" value={notifSettings.maintenanceWarningKm} onChange={e => setNotifSettings({ ...notifSettings, maintenanceWarningKm: e.target.value })} /></Field>
          </div>
          <Field label="Dusuk Puan Esigi"><Input type="number" value={notifSettings.lowScoreThreshold} onChange={e => setNotifSettings({ ...notifSettings, lowScoreThreshold: e.target.value })} /></Field>
          <Button onClick={() => toast.success("Bildirim ayarlari kaydedildi")}><Save className="w-4 h-4" /> Kaydet</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="w-4 h-4" /> Veritabani</CardTitle>
          <CardDescription>Veritabani baglanti durumu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Veritabani baglantisi aktif — Mock veri kullaniliyor
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Guvenlik</CardTitle>
          <CardDescription>Sifre politikasi ve guvenlik ayarlari</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm">Iki faktorlu dogrulama zorunlu</span>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm">Sifre karmasikligi zorunlu (buyuk harf, rakam, ozel karakter)</span>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm">90 gunde bir sifre degisikligi zorunlu</span>
          </div>
          <Button onClick={() => toast.success("Guvenlik ayarlari kaydedildi")}><Save className="w-4 h-4" /> Kaydet</Button>
        </CardContent>
      </Card>
    </div>
  );
}