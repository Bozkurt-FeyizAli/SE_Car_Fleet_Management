import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Field } from "../../shared/FormDialog";
import { toast } from "sonner";
import { Save, Building2, Bell, Users } from "lucide-react";
import { currentCompany, currentCompanyAdmin } from "../ManagerPanel";

export function SettingsTab() {
  const [companyForm, setCompanyForm] = useState({
    name: currentCompany.name,
    email: currentCompany.email,
    phone: currentCompany.phone,
    address: currentCompany.address,
    website: currentCompany.website,
  });

  const [profileForm, setProfileForm] = useState({
    full_name: currentCompanyAdmin.full_name,
    email: currentCompanyAdmin.email,
    phone: currentCompanyAdmin.phone ?? "",
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h2>Ayarlar</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Sirket Bilgileri</CardTitle>
          <CardDescription>Sirketinizin genel bilgilerini guncelleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Sirket Adi"><Input value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} /></Field>
          <Field label="E-posta"><Input type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} /></Field>
          <Field label="Telefon"><Input value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} /></Field>
          <Field label="Adres"><Input value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} /></Field>
          <Field label="Website"><Input value={companyForm.website} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} /></Field>
          <Button onClick={() => toast.success("Sirket bilgileri kaydedildi")}><Save className="w-4 h-4" /> Kaydet</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Profil Ayarlari</CardTitle>
          <CardDescription>Kendi hesap bilgilerinizi guncelleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Ad Soyad"><Input value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} /></Field>
          <Field label="E-posta"><Input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} /></Field>
          <Field label="Telefon"><Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} /></Field>
          <Field label="Yeni Sifre"><Input type="password" placeholder="Yeni sifrenizi girin" /></Field>
          <Field label="Sifre Tekrar"><Input type="password" placeholder="Sifrenizi tekrar girin" /></Field>
          <Button onClick={() => toast.success("Profil bilgileri kaydedildi")}><Save className="w-4 h-4" /> Kaydet</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Bildirim Tercihleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4" /><span className="text-sm">Siparis bildirimleri</span></div>
          <div className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4" /><span className="text-sm">Odeme bildirimleri</span></div>
          <div className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4" /><span className="text-sm">Arac sigorta/kasko uyarilari</span></div>
          <div className="flex items-center gap-3"><input type="checkbox" defaultChecked className="w-4 h-4" /><span className="text-sm">Sofor puan uyarilari</span></div>
          <div className="flex items-center gap-3"><input type="checkbox" className="w-4 h-4" /><span className="text-sm">SMS bildirimleri</span></div>
          <Button onClick={() => toast.success("Bildirim tercihleri kaydedildi")}><Save className="w-4 h-4" /> Kaydet</Button>
        </CardContent>
      </Card>
    </div>
  );
}
