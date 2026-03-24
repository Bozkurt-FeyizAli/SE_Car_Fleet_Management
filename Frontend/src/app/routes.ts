// PROJE_ANA_KLASOR/Frontend/src/routes.ts
import { lazy } from 'react';

// YOLLAR DÜZELTİLDİ: ../ kaldırıldı. routes.ts ve app aynı klasördedir (src)
export const LoginPage = lazy(() => import('../app/components/auth/LoginPage'));
export const DriverPanel = lazy(() => import('../app/components/driver/DriverPanel'));
export const ManagerPanel = lazy(() => import('../app/components/manager/ManagerPanel'));
export const SystemAdminPanel = lazy(() => import('../app/components/system-admin/SystemAdminPanel'));

export const APP_ROUTES = {
    LOGIN: '/',
    DRIVER: '/driver',
    MANAGER: '/manager',
    ADMIN: '/admin',
};

// Mapleme yaparken kullanacağımız konfigürasyon
export const routeConfig = [
    { path: APP_ROUTES.LOGIN, Element: LoginPage },
    { path: APP_ROUTES.DRIVER, Element: DriverPanel },
    { path: APP_ROUTES.MANAGER, Element: ManagerPanel },
    { path: APP_ROUTES.ADMIN, Element: SystemAdminPanel },
];