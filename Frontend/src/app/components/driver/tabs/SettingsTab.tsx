import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Field } from "../../shared/FormDialog";
import { toast } from "sonner";
import { Save, User, Bell, Shield } from "lucide-react";
const currentDriver = {
  id: 1,
  name: "Ahmet Yilmaz",
  first_name: "Ahmet",
  last_name: "Yilmaz",
  tc: "12345678901",
  phone: "555 123 4567",
  email: "ahmet@mail.com",
  license_type: "E",
  company_id: 101, 
  department_id: 201, 
  points: 100,
  status: "active" as const
};

export function SettingsTab() {
  const [profileForm, setProfileForm] = useState({
    first_name: currentDriver.first_name,
    last_name: currentDriver.last_name,
    email: currentDriver.email,
    phone: currentDriver.phone,
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h2>Ayarlar</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="w-4 h-4" /> Profil Bilgileri</CardTitle>
          <CardDescription>Kisisel bilgilerinizi guncelleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ad"><Input value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} /></Field>
            <Field label="Soyad"><Input value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} /></Field>
          </div>
          <Field label="E-posta"><Input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} /></Field>
          <Field label="Telefon"><Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} /></Field>
          <Button onClick={() => toast.success("Profil bilgileri kaydedildi")}><Save className="w-4 h-4" /> Kaydet</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Sifre Degistir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Mevcut Sifre"><Input type="password" placeholder="Mevcut sifreniz" /></Field>
          <Field label="Yeni Sifre"><Input type="password" placeholder="Yeni sifreniz" /></Field>
          <Field label="Sifre Tekrar"><Input type="password" placeholder="Yeni sifrenizi tekrar girin" /></Field>
          <Button onClick={() => toast.success("Sifre degistirildi")}><Save className="w-4 h-4" /> Sifre Degistir</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Bildirim Tercihleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4" /><span className="text-sm">Sefer bildirimleri</span></div>
          <div className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4" /><span className="text-sm">Bakim hatirlatmalari</span></div>
          <div className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4" /><span className="text-sm">Puan guncelleme bildirimleri</span></div>
          <div className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4" /><span className="text-sm">SMS bildirimleri</span></div>
          <div className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4" /><span className="text-sm">Belge gecerlilik uyarilari</span></div>
          <Button onClick={() => toast.success("Bildirim tercihleri kaydedildi")}><Save className="w-4 h-4" /> Kaydet</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uygulama Bilgisi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Filo Yonetim Sistemi — Sofor Uygulamasi</p>
            <p>Versiyon: 1.0.0</p>
            <p>Son guncelleme: 03.03.2026</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}