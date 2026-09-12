import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { LandingPage } from './components/landing/LandingPage';
import { RegisterPhotographerModal } from './components/auth/RegisterPhotographerModal';
import { PhotographerDashboard } from './components/photographer/PhotographerDashboard';
import { EventDetailView } from './components/photographer/EventDetailView';
import { ClientGalleryView } from './components/client/ClientGalleryView';
import { AdminDashboard } from './components/admin/AdminDashboard';

const AppContent: React.FC = () => {
  const { navigation } = useApp();

  const renderCurrentView = () => {
    switch (navigation.view) {
      case 'landing':
        return <LandingPage />;
      case 'register_photographer':
        return <RegisterPhotographerModal />;
      case 'photographer_dashboard':
      case 'photographer_events_list':
      case 'photographer_wallet':
      case 'photographer_settings':
        return <PhotographerDashboard />;
      case 'photographer_event_detail':
        return <EventDetailView eventId={navigation.eventId} />;
      case 'client_gallery':
        return <ClientGalleryView eventId={navigation.eventId} />;
      case 'admin_dashboard':
        return <AdminDashboard />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827] font-sans antialiased">
      <Header />
      <div className="flex-1">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
