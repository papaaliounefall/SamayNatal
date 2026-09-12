import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { CreateEventModal } from './CreateEventModal';
import { QRCodeModal } from '../common/QRCodeModal';
import {
  Camera,
  LayoutDashboard,
  Calendar,
  Image as ImageIcon,
  Users,
  CreditCard,
  BarChart2,
  FolderArchive,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  QrCode,
  Eye,
  Download,
  ExternalLink,
  ChevronRight,
  HardDrive,
} from 'lucide-react';
import { Event } from '../../types';

export const PhotographerDashboard: React.FC = () => {
  const {
    photographer,
    events,
    photos,
    orders,
    navigateTo,
    setRole,
  } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQrEvent, setSelectedQrEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'wallet' | 'settings'>('overview');

  // Filter events belonging to current photographer
  const myEvents = (events || []).filter((e) => e.photographerId === photographer?.id);

  // Compute metrics
  const totalEvents = myEvents.length;
  const totalPhotos = (photos || []).filter((p) => myEvents.some((e) => e.id === p.eventId)).length;
  const totalViews = myEvents.reduce((sum, e) => sum + (e.viewsCount || 0), 0);
  const totalDownloads = myEvents.reduce((sum, e) => sum + (e.downloadsCount || 0), 0);
  const totalSalesCFA = (orders || [])
    .filter((o) => o.photographerId === photographer?.id && o.paymentStatus === 'COMPLETED')
    .reduce((sum, o) => sum + (o.photographerEarningsCFA || 0), 0);

  const storageUsedPercent = photographer?.storageMaxMB
    ? Math.round(((photographer.storageUsedMB || 0) / photographer.storageMaxMB) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col md:flex-row">
      {/* 1. DARK SIDEBAR (#121212) */}
      <aside className="w-full md:w-64 bg-[#121212] text-neutral-300 flex flex-col justify-between shrink-0 border-r border-neutral-800 select-none">
        <div>
          {/* Brand & Photographer Info */}
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <img
                src={photographer.avatarUrl}
                alt={photographer.businessName}
                className="w-10 h-10 rounded-full object-cover border border-neutral-700"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {photographer.businessName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">
                    {photographer.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Storage Progress */}
            <div className="mt-4 pt-3 border-t border-neutral-800/80">
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> Stockage S3
                </span>
                <span className="font-mono text-white">
                  {(photographer.storageUsedMB / 1024).toFixed(1)} / {(photographer.storageMaxMB / 1024).toFixed(0)} Go
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#F25C05] h-full transition-all"
                  style={{ width: `${storageUsedPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left ${
                activeTab === 'overview'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#F25C05]" />
              Tableau de bord
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left ${
                activeTab === 'events'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4" />
                Événements
              </div>
              <span className="bg-neutral-800 text-neutral-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                {myEvents.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('events');
                navigateTo('photographer_event_detail', { eventId: myEvents[0]?.id });
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer text-left"
            >
              <ImageIcon className="w-4 h-4" />
              Galeries
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left ${
                activeTab === 'wallet'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4" />
                Ventes & Solde
              </div>
              <span className="text-[#F25C05] font-mono font-bold text-[11px]">
                {photographer.walletBalanceCFA.toLocaleString('fr-FR')} F
              </span>
            </button>

            <button
              onClick={() => {
                // switch to client view for current event
                setRole('CLIENT');
                navigateTo('client_gallery', { eventId: myEvents[0]?.id });
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer text-left"
            >
              <Eye className="w-4 h-4" />
              Aperçu Galerie Invité
            </button>
          </nav>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-neutral-800 space-y-1 text-xs">
          <button
            onClick={() => setRole('VISITOR')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion / Accueil
          </button>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E5E7EB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
              Bonjour, {photographer.firstName}
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              Espace de gestion professionnelle • {photographer.businessName} ({photographer.city})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              + Créer un événement
            </Button>
          </div>
        </div>

        {/* 3. KEY METRICS (SOBRIÉTÉ STRICTE) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-8 border-b border-[#E5E7EB]">
          <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Événements
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{totalEvents}</p>
          </div>

          <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Photos
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{totalPhotos}</p>
          </div>

          <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Vues
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-1">
              {totalViews.toLocaleString('fr-FR')}
            </p>
          </div>

          <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Téléchargements
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{totalDownloads}</p>
          </div>

          <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB] col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Ventes
            </p>
            <p className="text-2xl font-bold text-[#F25C05] mt-1 font-mono">
              {totalSalesCFA.toLocaleString('fr-FR')} <span className="text-xs font-normal text-[#111827]">FCFA</span>
            </p>
          </div>
        </div>

        {/* 4. RECENT EVENTS WITH LARGE THUMBNAILS */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#111827]">Événements récents</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Accédez à vos galeries pour importer de nouvelles photos ou exporter vos QR codes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs hover:shadow-md transition-shadow group flex flex-col justify-between"
              >
                <div>
                  {/* Large Cover Thumbnail */}
                  <div
                    onClick={() => navigateTo('photographer_event_detail', { eventId: evt.id })}
                    className="relative aspect-16/10 bg-neutral-900 cursor-pointer overflow-hidden"
                  >
                    <img
                      src={evt.coverPhotoUrl}
                      alt={evt.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                    />
                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 rounded border border-white/20">
                        {evt.status}
                      </span>
                    </div>

                    {/* Privacy badge */}
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-medium bg-black/70 backdrop-blur-xs text-neutral-300 px-2 py-0.5 rounded border border-white/20">
                        {evt.privacy === 'CODE_PIN' ? `PIN: ${evt.accessPin}` : evt.privacy}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                      <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">
                        📸 {evt.photosCount} photos
                      </span>
                      <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">
                        👁️ {evt.viewsCount} vues
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F25C05]">
                      {evt.category.replace('_', ' ')}
                    </span>
                    <h3
                      onClick={() => navigateTo('photographer_event_detail', { eventId: evt.id })}
                      className="text-base font-bold text-[#111827] mt-0.5 hover:text-[#F25C05] transition-colors cursor-pointer truncate"
                    >
                      {evt.title}
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1.5">
                      <span>{evt.location}</span> • <span>{evt.date}</span>
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 pb-4 pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedQrEvent(evt)}
                    icon={<QrCode className="w-3.5 h-3.5 text-[#F25C05]" />}
                  >
                    QR Code
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigateTo('photographer_event_detail', { eventId: evt.id })}
                    icon={<ChevronRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                  >
                    Gérer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={(newId) => {
          navigateTo('photographer_event_detail', { eventId: newId });
        }}
      />

      {/* QR Code Modal */}
      {selectedQrEvent && (
        <QRCodeModal
          isOpen={!!selectedQrEvent}
          onClose={() => setSelectedQrEvent(null)}
          event={selectedQrEvent}
        />
      )}
    </div>
  );
};
