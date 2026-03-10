import React, { useState } from "react";
// UI bileşenlerinin yollarını proje yapına göre (../../ui/...) güncelledim
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Form olayına (e) açıkça tip atayarak TypeScript hatasını çözüyoruz
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Backend endpoint'i
      const response = await fetch(
        "https://localhost:9001/api/Account/authenticate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      // LoginPage.tsx içindeki ilgili kısım
      // LoginPage.tsx içindeki handleLogin fonksiyonunun başarılı (response.ok) kısmı
      if (response.ok) {
        localStorage.setItem('token', data.jwToken);
        // Backend'den gelen user objesinde first_name ve last_name olduğunu varsayıyoruz 
        localStorage.setItem('user', JSON.stringify(data));

        // Veri tabanındaki role_name'e göre yönlendirme 
        const userRole = data.roles[0]; // Örn: 'DRIVER' 

        if (userRole === 'DRIVER') {
          window.location.href = '/driver';
        } else if (userRole === 'COMPANY_MANAGER') {
          window.location.href = '/manager';
        } else if (userRole === 'SYSTEM_ADMIN') {
          window.location.href = '/admin';
        }
      }
    } catch (err) {
      setError("Sunucuya bağlanılamadı. Backend'in çalıştığından emin olun.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-[400px] border-slate-800 bg-slate-900 text-white shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold tracking-tight">
            Filo Yönetimi
          </CardTitle>
          <p className="text-center text-sm text-slate-400">
            Hesabınıza erişmek için bilgilerinizi girin
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                E-posta
              </label>
              <input
                type="email"
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm ring-offset-slate-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                placeholder="basicuser@gmail.com"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Şifre</label>
              <input
                type="password"
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm ring-offset-slate-950 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:bg-blue-600/50"
            >
              {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
