import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/common/Header';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { RegisterPhotographerPage } from './components/auth/RegisterPhotographerModal';
import { PhotographerDashboard } from './components/photographer/PhotographerDashboard';
import { EventDetailView } from './components/photographer/EventDetailView';
import { ClientGalleryView } from './components/client/ClientGalleryView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { navigate, useLocation } from './lib/router';

const FullScreenLoader: React.FC = () => (
  <div className="min-h-[70vh] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
  </div>
);

const RequirePhotographer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  if (!user || user.role !== 'PHOTOGRAPHE') {
    navigate('/connexion');
    return <FullScreenLoader />;
  }
  return <>{children}</>;
};

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  if (!user || user.role !== 'ADMIN') {
    navigate('/connexion');
    return <FullScreenLoader />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const path = useLocation();
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <FullScreenLoader />
      </div>
    );
  }

  const galleryMatch = path.match(/^\/g\/([^/]+)\/?$/);
  const eventDetailMatch = path.match(/^\/dashboard\/evenements\/([^/]+)\/?$/);
  const resetPasswordMatch = path.match(/^\/reinitialiser-mot-de-passe\/([^/]+)\/([^/]+)\/?$/);

  const renderRoute = () => {
    if (path === '/' || path === '') return <LandingPage />;
    if (path === '/connexion') return <LoginPage />;
    if (path === '/mot-de-passe-oublie') return <ForgotPasswordPage />;
    if (resetPasswordMatch) return <ResetPasswordPage uid={resetPasswordMatch[1]} token={resetPasswordMatch[2]} />;
    if (path === '/inscription-photographe') return <RegisterPhotographerPage />;
    if (path === '/dashboard') {
      return (
        <RequirePhotographer>
          <PhotographerDashboard />
        </RequirePhotographer>
      );
    }
    if (eventDetailMatch) {
      return (
        <RequirePhotographer>
          <EventDetailView eventId={eventDetailMatch[1]} />
        </RequirePhotographer>
      );
    }
    if (path === '/admin') {
      return (
        <RequireAdmin>
          <AdminDashboard />
        </RequireAdmin>
      );
    }
    if (galleryMatch) return <ClientGalleryView slug={galleryMatch[1]} />;

    return <LandingPage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827] font-sans antialiased">
      <Header />
      <div className="flex-1">{renderRoute()}</div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
