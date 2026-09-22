import React, { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { CreateEventModal } from './CreateEventModal';
import { QRCodeModal } from '../common/QRCodeModal';
import { Image as ImageIcon, Plus, QrCode, ChevronRight } from 'lucide-react';
import { EventDetail, PhotographerProfile, Wallet } from '../../types/api';
import { fetchMyEvents } from '../../services/events';
import { navigate } from '../../lib/router';
import { PhotographerLayout } from './PhotographerLayout';
import { PhotographerOnboardingChecklist } from './PhotographerOnboardingChecklist';
import { ErrorState } from '../common/ErrorState';

const DashboardContent: React.FC<{ profile: PhotographerProfile; wallet: Wallet }> = ({ profile, wallet }) => {
  const [events, setEvents] = useState<EventDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQrEvent, setSelectedQrEvent] = useState<EventDetail | null>(null);

  const loadEvents = () => {
    // A non-approved photographer has no events and IsApprovedPhotographer
    // rejects the request with a 403 — that's an expected state, not a
    // failure, so skip the call rather than show an error the "Réessayer"
    // button could never actually fix.
    if (profile.status !== 'APPROUVÉ') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError(false);
    fetchMyEvents()
      .then((res) => setEvents(res.results))
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return <ErrorState message="Impossible de charger vos événements." onRetry={loadEvents} />;
  }

  const totalPhotos = events.reduce((sum, e) => sum + e.photosCount, 0);
  const totalViews = events.reduce((sum, e) => sum + e.viewsCount, 0);
  const totalDownloads = events.reduce((sum, e) => sum + e.downloadsCount, 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">Bonjour, {profile.businessName}</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Espace de gestion professionnelle • {profile.city} ({profile.country})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {profile.status === 'APPROUVÉ' ? (
            <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
              + Créer un événement
            </Button>
          ) : (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
              Compte {profile.status.toLowerCase()} — création d'événements indisponible
            </span>
          )}
        </div>
      </div>

      <div className="mt-8">
        <PhotographerOnboardingChecklist events={events} wallet={wallet} onCreateEvent={() => setIsCreateModalOpen(true)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-b border-[#E5E7EB]">
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Événements</p>
          <p className="text-2xl font-bold text-[#111827] mt-1">{events.length}</p>
        </div>
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Photos</p>
          <p className="text-2xl font-bold text-[#111827] mt-1">{totalPhotos}</p>
        </div>
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Vues</p>
          <p className="text-2xl font-bold text-[#111827] mt-1">{totalViews.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Téléchargements</p>
          <p className="text-2xl font-bold text-[#111827] mt-1">{totalDownloads}</p>
        </div>
      </div>

      <div className="pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">Événements récents</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Accédez à vos galeries pour importer de nouvelles photos ou exporter vos QR codes.
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-12 text-center bg-[#F8F9FA]">
            <p className="text-sm font-semibold text-[#111827]">Aucun événement pour l'instant</p>
            <p className="text-xs text-[#6B7280] mt-1">Créez votre premier événement pour commencer à publier des photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-xs hover:shadow-md transition-shadow group flex flex-col justify-between"
              >
                <div>
                  <div
                    onClick={() => navigate(`/dashboard/evenements/${evt.id}`)}
                    className="relative aspect-16/10 bg-neutral-900 cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    {evt.coverPhotoUrl ? (
                      <img src={evt.coverPhotoUrl} alt={evt.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-neutral-700" />
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-black/70 backdrop-blur-xs text-white px-2 py-0.5 rounded border border-white/20">
                        {evt.status}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-medium bg-black/70 backdrop-blur-xs text-neutral-300 px-2 py-0.5 rounded border border-white/20">
                        {evt.privacy === 'CODE_PIN' ? 'PIN requis' : evt.privacy}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                      <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">{evt.photosCount} photos</span>
                      <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded">{evt.viewsCount} vues</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F25C05]">{evt.category.replace('_', ' ')}</span>
                    <h3 className="mt-0.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/evenements/${evt.id}`)}
                        className="text-base font-bold text-[#111827] hover:text-[#F25C05] transition-colors cursor-pointer truncate block w-full text-left focus:outline-none focus:ring-2 focus:ring-[#F25C05] focus:ring-offset-1 rounded"
                      >
                        {evt.title}
                      </button>
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-1.5">
                      <span>{evt.location}</span> • <span>{evt.date}</span>
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedQrEvent(evt)} icon={<QrCode className="w-3.5 h-3.5 text-[#F25C05]" />}>
                    QR Code
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/dashboard/evenements/${evt.id}`)}
                    icon={<ChevronRight className="w-3.5 h-3.5" />}
                    iconPosition="right"
                  >
                    Gérer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={(newId) => navigate(`/dashboard/evenements/${newId}`)}
      />

      {selectedQrEvent && <QRCodeModal isOpen={!!selectedQrEvent} onClose={() => setSelectedQrEvent(null)} event={selectedQrEvent} />}
    </>
  );
};

export const PhotographerDashboard: React.FC = () => (
  <PhotographerLayout active="dashboard">{({ profile, wallet }) => <DashboardContent profile={profile} wallet={wallet} />}</PhotographerLayout>
);
