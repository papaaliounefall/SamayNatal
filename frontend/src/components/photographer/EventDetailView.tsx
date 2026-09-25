import React, { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { PhotoUploaderModal } from './PhotoUploaderModal';
import { PhotoEditModal } from './PhotoEditModal';
import { QRCodeModal } from '../common/QRCodeModal';
import { WatermarkSettingsModal } from './WatermarkSettingsModal';
import { PhotographerLayout } from './PhotographerLayout';
import { ErrorState } from '../common/ErrorState';
import {
  ArrowLeft,
  UploadCloud,
  QrCode,
  Sliders,
  Eye,
  Archive,
  FolderPlus,
  Lock,
  Loader2,
  Star,
  Pencil,
  Trash2,
  Globe,
  AlertTriangle,
  MoreVertical,
} from 'lucide-react';
import { EventDetail, Photo } from '../../types/api';
import { fetchMyEvent, updateEvent, createGallery, setCoverPhoto } from '../../services/events';
import { fetchMyPhotos, deletePhoto } from '../../services/photos';
import { navigate } from '../../lib/router';
import { ApiError } from '../../lib/api';

interface EventDetailContentProps {
  eventId: string;
}

const EventDetailContent: React.FC<EventDetailContentProps> = ({ eventId }) => {
  const [currentEvent, setCurrentEvent] = useState<EventDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeGalleryId, setActiveGalleryId] = useState<string>('all');
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [showAddGallery, setShowAddGallery] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [pendingActionPhotoId, setPendingActionPhotoId] = useState<string | null>(null);
  const [photoActionError, setPhotoActionError] = useState('');

  const loadEvent = async () => {
    const [evt, photoPage] = await Promise.all([fetchMyEvent(eventId), fetchMyPhotos(eventId)]);
    setCurrentEvent(evt);
    setPhotos(photoPage.results);
  };

  const load = () => {
    setIsLoading(true);
    setLoadError(false);
    loadEvent()
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return <ErrorState message="Impossible de charger cet événement." onRetry={load} />;
  }

  if (!currentEvent) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[#6B7280]">Événement non trouvé.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')} className="mt-4">
          Retour au tableau de bord
        </Button>
      </div>
    );
  }

  const displayedPhotos = activeGalleryId === 'all' ? photos : photos.filter((p) => p.gallery === activeGalleryId);

  const handleAddSubGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryName.trim()) return;
    const gallery = await createGallery(eventId, newGalleryName.trim());
    setCurrentEvent((prev) => (prev ? { ...prev, galleries: [...prev.galleries, gallery] } : prev));
    setNewGalleryName('');
    setShowAddGallery(false);
    setActiveGalleryId(gallery.id);
  };

  const handlePublish = async () => {
    const updated = await updateEvent(eventId, { status: 'ACTIF' });
    setCurrentEvent(updated);
  };

  const handleArchiveToggle = async () => {
    const nextStatus = currentEvent.status === 'ARCHIVÉ' ? 'ACTIF' : 'ARCHIVÉ';
    const updated = await updateEvent(eventId, { status: nextStatus });
    setCurrentEvent(updated);
  };

  const handleSetCover = async (photo: Photo) => {
    if (photo.status !== 'READY') return;
    setPhotoActionError('');
    setPendingActionPhotoId(photo.id);
    try {
      const updated = await setCoverPhoto(eventId, photo.id);
      setCurrentEvent(updated);
    } catch (err) {
      setPhotoActionError(err instanceof ApiError ? err.detail || 'Impossible de définir cette photo comme couverture.' : 'Erreur réseau.');
    } finally {
      setPendingActionPhotoId(null);
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    const label = photo.title || photo.originalFilename;
    if (!window.confirm(`Supprimer définitivement "${label}" ? Cette action est irréversible.`)) return;
    setPhotoActionError('');
    setPendingActionPhotoId(photo.id);
    try {
      await deletePhoto(photo.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setCurrentEvent((prev) => (prev ? { ...prev, photosCount: Math.max(0, prev.photosCount - 1) } : prev));
    } catch (err) {
      setPhotoActionError(err instanceof ApiError ? err.detail || 'Impossible de supprimer cette photo.' : 'Erreur réseau.');
    } finally {
      setPendingActionPhotoId(null);
    }
  };

  return (
    <>
      <div className="relative bg-[#121212] text-white rounded-2xl overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {currentEvent.coverPhotoUrl && (
            <img src={currentEvent.coverPhotoUrl} alt={currentEvent.title} className="w-full h-full object-cover opacity-25" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent" />
        </div>

        <div className="relative px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F25C05] bg-[#FFF1EB]/10 border border-orange-500/30 px-2.5 py-0.5 rounded">
                  {currentEvent.category.replace('_', ' ')}
                </span>
                <span
                  className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                    currentEvent.status === 'ACTIF'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      : currentEvent.status === 'BROUILLON'
                        ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  STATUT : {currentEvent.status}
                </span>
                {currentEvent.privacy === 'CODE_PIN' && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-300 border border-neutral-700 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Protégé par PIN
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{currentEvent.title}</h1>

              <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl">
                {currentEvent.location} • {currentEvent.date}
                {currentEvent.description ? ` — ${currentEvent.description}` : ''}
              </p>

              <div className="flex items-center gap-4 text-xs text-neutral-400 pt-2 font-mono">
                <span>{currentEvent.photosCount} photos</span>
                <span>•</span>
                <span>{currentEvent.viewsCount} consultations</span>
                <span>•</span>
                <span>{currentEvent.downloadsCount} téléchargements</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="primary" size="md" onClick={() => setIsUploaderOpen(true)} icon={<UploadCloud className="w-4 h-4" />}>
                Ajouter des photos
              </Button>

              {/* Desktop: every action gets its own button. Mobile: the
                  same four secondary actions collapse into one menu so the
                  header doesn't wrap across three cramped rows. */}
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="dark" size="md" onClick={() => setIsQrModalOpen(true)} icon={<QrCode className="w-4 h-4 text-[#F25C05]" />}>
                  QR Code
                </Button>
                <Button variant="dark" size="md" onClick={() => setIsWatermarkModalOpen(true)} icon={<Sliders className="w-4 h-4" />}>
                  Filigrane
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => window.open(`/g/${currentEvent.slug}`, '_blank')}
                  icon={<Eye className="w-4 h-4" />}
                >
                  Aperçu Invité
                </Button>
                {currentEvent.status !== 'BROUILLON' && currentEvent.status !== 'SUSPENDU' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleArchiveToggle}
                    className="text-neutral-400 hover:text-white"
                    icon={<Archive className="w-4 h-4" />}
                  >
                    {currentEvent.status === 'ARCHIVÉ' ? 'Désarchiver' : 'Archiver'}
                  </Button>
                )}
              </div>

              <div className="relative sm:hidden">
                <button
                  onClick={() => setIsMoreMenuOpen((v) => !v)}
                  aria-label="Plus d'actions"
                  className="p-2.5 rounded-md bg-[#262626] hover:bg-neutral-700 text-white border border-neutral-700 cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {isMoreMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsMoreMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-neutral-700 rounded-lg shadow-lg z-20 py-1 text-sm">
                      <button
                        onClick={() => { setIsMoreMenuOpen(false); setIsQrModalOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-white hover:bg-neutral-800 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4 text-[#F25C05]" /> QR Code
                      </button>
                      <button
                        onClick={() => { setIsMoreMenuOpen(false); setIsWatermarkModalOpen(true); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-white hover:bg-neutral-800 cursor-pointer"
                      >
                        <Sliders className="w-4 h-4" /> Filigrane
                      </button>
                      <button
                        onClick={() => { setIsMoreMenuOpen(false); window.open(`/g/${currentEvent.slug}`, '_blank'); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-white hover:bg-neutral-800 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" /> Aperçu Invité
                      </button>
                      {currentEvent.status !== 'BROUILLON' && currentEvent.status !== 'SUSPENDU' && (
                        <button
                          onClick={() => { setIsMoreMenuOpen(false); handleArchiveToggle(); }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                        >
                          <Archive className="w-4 h-4" /> {currentEvent.status === 'ARCHIVÉ' ? 'Désarchiver' : 'Archiver'}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {currentEvent.status === 'BROUILLON' && (
            <div className="mt-6 bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Cette galerie est en <strong>brouillon</strong> : vos clients ne peuvent pas encore y accéder, même avec le lien ou le QR code.
                  Publiez-la quand elle est prête.
                </span>
              </p>
              <Button variant="primary" size="sm" onClick={handlePublish} icon={<Globe className="w-4 h-4" />} className="shrink-0">
                Publier la galerie
              </Button>
            </div>
          )}

          {currentEvent.status === 'SUSPENDU' && (
            <div className="mt-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4">
              <p className="text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Cette galerie a été suspendue par l'administration et n'est plus accessible à vos clients.
                  Contactez le support pour en savoir plus.
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border border-[#E5E7EB] rounded-xl bg-[#F8F9FA] sticky top-20 z-30 mt-6">
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveGalleryId('all')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeGalleryId === 'all' ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB] font-semibold' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Toutes les photos ({photos.length})
            </button>

            {currentEvent.galleries.map((gal) => (
              <button
                key={gal.id}
                onClick={() => setActiveGalleryId(gal.id)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeGalleryId === gal.id ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB] font-semibold' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {gal.name} ({photos.filter((p) => p.gallery === gal.id).length})
              </button>
            ))}

            {!showAddGallery ? (
              <button
                onClick={() => setShowAddGallery(true)}
                className="text-xs px-2.5 py-1 text-[#F25C05] hover:bg-[#FFF1EB] rounded transition-colors cursor-pointer flex items-center gap-1 font-medium"
              >
                <FolderPlus className="w-3.5 h-3.5" /> + Sous-galerie
              </button>
            ) : (
              <form onSubmit={handleAddSubGallery} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="ex: Portraits"
                  value={newGalleryName}
                  onChange={(e) => setNewGalleryName(e.target.value)}
                  className="text-xs px-2 py-1 bg-white border border-[#E5E7EB] rounded w-32 focus:outline-none focus:border-[#F25C05]"
                  autoFocus
                />
                <Button variant="primary" size="sm" type="submit">Ajouter</Button>
                <button type="button" onClick={() => setShowAddGallery(false)} className="text-xs text-[#6B7280] px-1 hover:text-black cursor-pointer">
                  ✕
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="py-8">
        {photoActionError && (
          <p className="mb-4 text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">{photoActionError}</p>
        )}

        {displayedPhotos.length === 0 ? (
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-12 text-center bg-[#F8F9FA]">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#F25C05] mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">Aucune photo dans cette sous-galerie</h3>
            <p className="text-xs text-[#6B7280] mt-1 max-w-md mx-auto">
              Glissez vos fichiers ou commencez l'importation de vos clichés pour alimenter cette galerie.
            </p>
            <div className="mt-4">
              <Button variant="primary" size="sm" onClick={() => setIsUploaderOpen(true)} icon={<UploadCloud className="w-4 h-4" />}>
                Importer des photos maintenant
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {displayedPhotos.map((photo) => {
              const isCover = !!currentEvent.coverPhotoId && currentEvent.coverPhotoId === photo.id;
              const isBusy = pendingActionPhotoId === photo.id;
              return (
                <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-neutral-900 shadow-xs">
                  <div className="aspect-4/3 overflow-hidden bg-neutral-100 relative">
                    {photo.status === 'READY' && photo.thumbnailUrl ? (
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.title || photo.originalFilename}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-[10px] font-mono">{photo.status === 'FAILED' ? 'Échec du traitement' : 'Traitement en cours'}</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                      #{photo.photoNumber}
                    </div>

                    {isCover && (
                      <div className="absolute top-2 right-2 bg-[#F25C05] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" /> Couverture
                      </div>
                    )}

                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2 pt-6 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[11px] font-medium truncate">{photo.title || photo.originalFilename}</p>
                      <div className="flex items-center justify-between text-[10px] text-neutral-300 font-mono mt-0.5">
                        <span>{(photo.sizeBytes / (1024 * 1024)).toFixed(1)} Mo</span>
                        <span>{photo.priceCfa.toLocaleString('fr-FR')} F</span>
                      </div>

                      {photo.status === 'READY' && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/15">
                          {!isCover && (
                            <button
                              onClick={() => handleSetCover(photo)}
                              disabled={isBusy}
                              title="Définir comme couverture"
                              className="flex-1 h-6 rounded bg-white/10 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingPhoto(photo)}
                            disabled={isBusy}
                            title="Modifier"
                            className="flex-1 h-6 rounded bg-white/10 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo)}
                            disabled={isBusy}
                            title="Supprimer"
                            className="flex-1 h-6 rounded bg-white/10 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PhotoUploaderModal
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        event={currentEvent}
        selectedGalleryId={activeGalleryId !== 'all' ? activeGalleryId : undefined}
        onUploaded={loadEvent}
      />

      <QRCodeModal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} event={currentEvent} />

      <WatermarkSettingsModal
        isOpen={isWatermarkModalOpen}
        onClose={() => setIsWatermarkModalOpen(false)}
        event={currentEvent}
        onSaved={(updated) => setCurrentEvent(updated)}
      />

      {editingPhoto && (
        <PhotoEditModal
          isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          photo={editingPhoto}
          event={currentEvent}
          onSaved={(updated) => setPhotos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
        />
      )}
    </>
  );
};

interface EventDetailViewProps {
  eventId?: string;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ eventId }) => {
  if (!eventId) return null;
  return (
    <PhotographerLayout active="dashboard">
      {() => <EventDetailContent eventId={eventId} />}
    </PhotographerLayout>
  );
};
