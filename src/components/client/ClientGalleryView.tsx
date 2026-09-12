import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { LightboxModal } from './LightboxModal';
import { CheckoutModal } from './CheckoutModal';
import { WatermarkOverlay } from '../common/WatermarkOverlay';
import {
  Camera,
  Search,
  Lock,
  Heart,
  ShoppingBag,
  Sparkles,
  Share2,
  Download,
  Filter,
  ArrowLeft,
  Eye,
  Check,
} from 'lucide-react';
import { Photo } from '../../types';

interface ClientGalleryViewProps {
  eventId?: string;
}

export const ClientGalleryView: React.FC<ClientGalleryViewProps> = ({ eventId }) => {
  const { events, photos, cart, addToCart, navigateTo, setRole } = useApp();

  const currentEvent = events.find((e) => e.id === eventId) || events[0];

  // PIN Protection State
  const [isPinUnlocked, setIsPinUnlocked] = useState(
    currentEvent?.privacy !== 'CODE_PIN'
  );
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Sub-galleries & filters
  const [activeGalleryId, setActiveGalleryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Selfie / Face Search Simulation Modal
  const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
  const [selfieFilterActive, setSelfieFilterActive] = useState(false);

  // Lightbox & Checkout Modals
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-[#6B7280]">Galerie introuvable ou lien expiré.</p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateTo('landing')}
            className="mt-4"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Handle PIN unlock
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === currentEvent.accessPin || enteredPin === '2026') {
      setIsPinUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Filter photos
  const eventPhotos = (photos || []).filter((p) => p.eventId === currentEvent?.id);

  const filteredPhotos = eventPhotos.filter((photo) => {
    // Gallery match
    if (activeGalleryId !== 'all' && photo.galleryId !== activeGalleryId) {
      return false;
    }
    // Favorites match
    if (onlyFavorites && !favorites.includes(photo.id)) {
      return false;
    }
    // Selfie search match simulation (returns photos tagged with 'mariée' or photoNumber > 102)
    if (selfieFilterActive && photo.photoNumber % 2 !== 0) {
      return false;
    }
    // Search query match (photo number or title)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = photo.photoNumber.toString().includes(q);
      const matchTitle = photo.title.toLowerCase().includes(q);
      const matchTags = photo.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchNum && !matchTitle && !matchTags) return false;
    }
    return true;
  });

  const toggleFavorite = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorites.includes(photoId)) {
      setFavorites(favorites.filter((id) => id !== photoId));
    } else {
      setFavorites([...favorites, photoId]);
    }
  };

  // If locked by PIN
  if (!isPinUnlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-200 text-[#F25C05] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F25C05] bg-[#FFF1EB] px-2.5 py-1 rounded">
              Galerie Privée Sécurisée
            </span>
            <h2 className="text-xl font-bold text-[#111827] mt-3">
              {currentEvent.title}
            </h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Cette galerie est protégée par un code PIN défini par {currentEvent.photographerName}.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={8}
                placeholder="Code PIN à 4 chiffres"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                className="w-48 text-center text-lg font-mono tracking-widest px-3 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F25C05]"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  Code PIN incorrect. Veuillez réessayer.
                </p>
              )}
            </div>

            <Button variant="primary" size="md" type="submit" className="w-full">
              Déverrouiller l'accès
            </Button>
          </form>

          <div className="pt-2 border-t border-[#E5E7EB] text-[11px] text-[#6B7280]">
            <span>Code de démonstration : </span>
            <button
              onClick={() => {
                setEnteredPin(currentEvent.accessPin || '2026');
                setIsPinUnlocked(true);
              }}
              className="font-mono font-bold text-[#F25C05] hover:underline cursor-pointer"
            >
              {currentEvent.accessPin || '2026'} (Cliquer pour débloquer)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 1. BRAND & EVENT HEADER */}
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span className="font-semibold text-[#111827]">{currentEvent.photographerName}</span>
                <span>•</span>
                <span>{currentEvent.location}</span>
                <span>•</span>
                <span>{currentEvent.date}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
                {currentEvent.title}
              </h1>
              {currentEvent.description && (
                <p className="text-xs text-[#6B7280] mt-1 max-w-2xl">
                  {currentEvent.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Share */}
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert('Lien direct de la galerie copié dans votre presse-papiers !');
                }}
                className="text-xs text-[#111827] bg-[#F8F9FA] hover:bg-gray-100 border border-[#E5E7EB] px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> Partager
              </button>

              {/* Cart CTA */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCheckoutOpen(true)}
                icon={<ShoppingBag className="w-4 h-4" />}
              >
                Panier ({cart.length})
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. FILTER CONTROLS & SEARCH */}
      <div className="border-b border-[#E5E7EB] bg-[#F8F9FA] sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Sub-galleries navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveGalleryId('all')}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeGalleryId === 'all'
                    ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB] font-semibold'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Toutes ({eventPhotos.length})
              </button>

              {currentEvent.galleries.map((gal) => {
                const count = eventPhotos.filter((p) => p.galleryId === gal.id).length;
                return (
                  <button
                    key={gal.id}
                    onClick={() => setActiveGalleryId(gal.id)}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      activeGalleryId === gal.id
                        ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB] font-semibold'
                        : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    {gal.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search & Smart Tools */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Search input (photo # or bib) */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Recherche n° / dossard..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#F25C05]"
                />
              </div>

              {/* Favorites toggle */}
              <button
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                  onlyFavorites
                    ? 'bg-red-50 text-red-600 border-red-200 font-semibold'
                    : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'
                }`}
                title="Afficher uniquement mes favoris"
              >
                <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-red-600' : ''}`} />
                <span className="hidden sm:inline">Favoris ({favorites.length})</span>
              </button>

              {/* Facial / Selfie Recognition Simulation Button */}
              <button
                onClick={() => setIsSelfieModalOpen(true)}
                className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  selfieFilterActive
                    ? 'bg-[#FFF1EB] text-[#F25C05] border-orange-300 font-semibold'
                    : 'bg-white text-[#111827] border-[#E5E7EB] hover:bg-gray-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F25C05]" />
                <span className="hidden sm:inline">
                  {selfieFilterActive ? 'Recherche visage active' : 'Trouver mon visage'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selfie banner notice if active */}
      {selfieFilterActive && (
        <div className="bg-[#FFF1EB] border-b border-orange-200 px-4 py-2 text-xs text-[#F25C05] flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Sparkles className="w-4 h-4" />
            <span>Filtre de reconnaissance faciale appliqué : affichage de vos photos correspondantes.</span>
            <button
              onClick={() => setSelfieFilterActive(false)}
              className="ml-auto underline font-bold cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* 3. PHOTO GRID (MASONRY/GRID) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-16 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]">
            <p className="text-sm font-semibold text-[#111827]">Aucune photo ne correspond à votre filtre.</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Essayez de réinitialiser vos termes de recherche ou de sélectionner « Toutes ».
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveGalleryId('all');
                setOnlyFavorites(false);
                setSelfieFilterActive(false);
              }}
              className="mt-4"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredPhotos.map((photo, index) => {
              const isFav = favorites.includes(photo.id);
              const isInCart = cart.some((c) => c.photoId === photo.id);

              return (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-[#E5E7EB] hover:border-gray-400 shadow-xs cursor-pointer transition-all duration-200"
                >
                  <div className="aspect-4/3 relative overflow-hidden bg-neutral-100">
                    <img
                      src={photo.urlPreview}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                    />

                    {/* Watermark overlay */}
                    {currentEvent.watermark.enabled && (
                      <WatermarkOverlay watermark={currentEvent.watermark} />
                    )}

                    {/* Photo number pill */}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      #{photo.photoNumber}
                    </div>

                    {/* Favorite button */}
                    <button
                      onClick={(e) => toggleFavorite(photo.id, e)}
                      className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                        isFav
                          ? 'bg-white text-red-500 shadow'
                          : 'bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70'
                      }`}
                      title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500' : ''}`} />
                    </button>

                    {/* Bottom Action overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-white flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div>
                        <p className="text-[11px] font-medium truncate">{photo.title}</p>
                        <p className="text-[10px] text-neutral-300 font-mono">
                          {photo.priceCFA.toLocaleString('fr-FR')} FCFA (HD)
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(photo, 'SINGLE');
                        }}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          isInCart
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#F25C05] hover:bg-[#D94F04] text-white'
                        }`}
                        title="Ajouter au panier"
                      >
                        {isInCart ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 4. FLOATING CART SUMMARY (WHEN NOT EMPTY) */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="bg-[#121212] hover:bg-black text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-neutral-700 transition-transform hover:scale-103 cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-[#F25C05]" />
              <span className="absolute -top-1.5 -right-2 bg-[#F25C05] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            </div>
            <div className="text-left text-xs">
              <p className="font-bold">Finaliser ma commande</p>
              <p className="text-[10px] text-neutral-300 font-mono">
                {cart.reduce((s, i) => s + i.priceCFA, 0).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          </button>
        </div>
      )}

      {/* 5. LIGHTBOX MODAL */}
      {lightboxIndex !== null && (
        <LightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          event={currentEvent}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
        />
      )}

      {/* 6. CHECKOUT MODAL */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={currentEvent}
      />

      {/* 7. SELFIE / FACE RECOGNITION SEARCH SIMULATION MODAL */}
      {isSelfieModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-full bg-[#FFF1EB] text-[#F25C05] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Recherche Faciale Intelligente</h3>
                <p className="text-[11px] text-[#6B7280]">
                  Retrouvez immédiatement toutes vos photos parmi les {eventPhotos.length} clichés de l'événement.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 text-center space-y-2 bg-[#F8F9FA]">
              <Camera className="w-8 h-8 text-[#F25C05] mx-auto" />
              <p className="text-xs font-semibold text-[#111827]">
                Prenez un selfie ou importez une photo de votre visage
              </p>
              <p className="text-[11px] text-[#6B7280]">
                Analyse vectorielle par embedding facial (simulation instantanée).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsSelfieModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelfieFilterActive(true);
                  setIsSelfieModalOpen(false);
                }}
              >
                Lancer l'analyse du visage
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
