// src/App.tsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { routeConfig, APP_ROUTES } from './routes';
import { Toaster } from 'sonner';

const App: React.FC = () => {
    return (
        <Router>
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-white">Yükleniyor...</div>}>
                <Routes>
                    {routeConfig.map((route) => (
                        <Route 
                            key={route.path} 
                            path={route.path} 
                            // Elementi bir React bileşeni olarak render ediyoruz
                            element={<route.Element />} 
                        />
                    ))}
                    <Route path="*" element={<Navigate to={APP_ROUTES.LOGIN} replace />} />
                </Routes>
                {/* Toaster component without modifying sonner defaults extensively */}
                <Toaster richColors position="top-right" />
            </Suspense>
        </Router>
    );
};

export default App;