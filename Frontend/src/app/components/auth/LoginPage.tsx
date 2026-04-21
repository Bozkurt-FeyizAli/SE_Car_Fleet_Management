import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// UI bileşenlerinin yollarını proje yapına göre (../../ui/...) güncelledim
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import logo from "../../../assets/logo.jpeg";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  // Form olayına (e) açıkça tip atayarak TypeScript hatasını çözüyoruz
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {

      const response = await fetch("/api/Auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Girdiğiniz e-posta veya şifre hatalı.");
      }

      const data = await response.json();

      console.log("Login API Response Data:", data);

      // Token ve kullanıcı bilgilerini kaydet
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));

      // Token'i decode edip rol bilgisini çekiyoruz (gerçek backend JWT 'role' claim'i kullanıyor)
      const base64Url = data.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const decodedToken = JSON.parse(jsonPayload);
      const jwtRole = decodedToken.role || decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";
      const roleStr = String(jwtRole);
      const apiRole = String(data.role || "");
      
      console.log("Login Debug - JWT Role:", roleStr, "API Role:", apiRole);

      const emailLower = email.toLowerCase();

      // Priority 1: Check numeric IDs (0: Admin, 1: Manager, 2: Driver) - THE SOURCE OF TRUTH
      if (roleStr === "0" || apiRole === "0") {
        navigate('/admin');
      } else if (roleStr === "1" || apiRole === "1") {
        navigate('/manager');
      } else if (roleStr === "2" || apiRole === "2") {
        navigate('/driver');
      }
      // Priority 2: Check standard strings if IDs are missing/ambiguous
      else if (apiRole === "Süper Admin" || roleStr === "Süper Admin" || apiRole === "Admin" || roleStr === "Admin" || emailLower === "admin@fleet.com") {
        navigate('/admin');
      } else if (apiRole === "Yönetici" || roleStr === "Yönetici" || roleStr === "Manager" || apiRole === "Manager" || emailLower === "yonetici@fleet.com") {
        navigate('/manager');
      } else if (apiRole === "Sürücü" || roleStr === "Sürücü" || roleStr === "Driver" || apiRole === "Driver" || emailLower === "sofor@fleet.com") {
        navigate('/driver');
      } 
      // Priority 3: Final fallbacks based on role string content
      else {
        const combinedRoles = (roleStr + "|" + apiRole).toLowerCase();
        if (combinedRoles.includes("admin")) navigate('/admin');
        else if (combinedRoles.includes("yönetici") || combinedRoles.includes("manager")) navigate('/manager');
        else if (combinedRoles.includes("sürücü") || combinedRoles.includes("driver") || combinedRoles.includes("sofor")) navigate('/driver');
        else navigate('/manager'); // Default fallback
      }

    } catch (err: any) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError("Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Bilinmeyen bir hata oluştu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-[420px] border-slate-800 bg-slate-900 text-white shadow-2xl relative overflow-hidden">
        {/* Dekoratif üst çizgi */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-400"></div>

        <CardHeader className="space-y-4 pt-8 pb-4">
          <div className="flex justify-center">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-slate-800 shadow-xl flex items-center justify-center bg-slate-950">
              <img
                src={logo}
                alt="Fleet Master Logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <CardTitle className="text-center text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Fleet Master
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
                placeholder="superadmin@gmail.com"
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
                placeholder="123Pa$$word!"
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
