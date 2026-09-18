import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { LightboxModal } from './LightboxModal';
import { CheckoutModal } from './CheckoutModal';
import { WatermarkOverlay } from '../common/WatermarkOverlay';
import { Search, Lock, Heart, ShoppingBag, Share2, Check, Download } from 'lucide-react';
import { PublicEvent, PublicPhoto } from '../../types/api';
import { fetchPublicEvent, unlockEvent } from '../../services/events';
import { fetchPublicGalleryPhotos, requestHdDownload } from '../../services/photos';
import { ApiError } from '../../lib/api';
import { navigate } from '../../lib/router';

interface ClientGalleryViewProps {
  slug: string;
}

export const ClientGalleryView: React.FC<ClientGalleryViewProps> = ({ slug }) => {
  const { cart, addToCart, isInCart } = useCart();
  const { user, isLoading: authIsLoading } = useAuth();

  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [photos, setPhotos] = useState<PublicPhoto[]>([]);
  const [activeGalleryId, setActiveGalleryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState<string | null>(null);

  const loadPhotosForGallery = async (evt: PublicEvent, galleryId: string) => {
    // Passing the logged-in client's email lets the backend flag photos
    // they've already purchased (hdAvailable) — guests with no account
    // still see prices/cart as usual, since there's no email to check.
    const clientEmail = user?.role === 'CLIENT' ? user.email : undefined;
    if (galleryId === 'all') {
      const results = await Promise.all(evt.galleries.map((g) => fetchPublicGalleryPhotos(evt.slug, g.id, clientEmail)));
      setPhotos(results.flat());
    } else {
      setPhotos(await fetchPublicGalleryPhotos(evt.slug, galleryId, clientEmail));
    }
  };

  const handleDownload = async (photo: PublicPhoto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || downloadingPhotoId) return;
    setDownloadingPhotoId(photo.id);
    try {
      const res = await requestHdDownload(photo.id, user.email);
      window.open(res.downloadUrl, '_blank', 'noopener');
    } catch {
      // A stale/expired grant is rare and not worth a dedicated error UI —
      // the client can simply try again.
    } finally {
      setDownloadingPhotoId(null);
    }
  };

  useEffect(() => {
    // Wait for auth to resolve first — whether this client has an
    // authenticated session decides both the PIN bypass (server-side, via
    // the access token) and which photos come back flagged hdAvailable
    // (client-side, via the clientEmail query param below). Fetching
    // before that resolves would silently treat a returning client as an
    // anonymous guest on every fresh page load. hadSessionHint() means
    // this only adds a real wait for visitors who actually have a
    // session to restore — anonymous visitors resolve instantly.
    if (authIsLoading) return;

    setIsLoading(true);
    fetchPublicEvent(slug)
      .then(async (evt) => {
        setEvent(evt);
        if (evt.unlocked) {
          await loadPhotosForGallery(evt, 'all');
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, authIsLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-[#6B7280]">Galerie introuvable ou lien expiré.</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/')} className="mt-4">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnlocking(true);
    setPinError(false);
    try {
      await unlockEvent(slug, enteredPin);
      const refreshed = await fetchPublicEvent(slug);
      setEvent(refreshed);
      await loadPhotosForGallery(refreshed, 'all');
    } catch {
      setPinError(true);
    } finally {
      setIsUnlocking(false);
    }
  };

  if (!event.unlocked) {
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
            <h2 className="text-xl font-bold text-[#111827] mt-3">{event.title}</h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Cette galerie est protégée par un code PIN défini par {event.photographerName}.
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label htmlFor="gallery-pin" className="sr-only">Code PIN</label>
              <input
                id="gallery-pin"
                type="password"
                maxLength={8}
                placeholder="Code PIN"
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                className="w-48 text-center text-lg font-mono tracking-widest px-3 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F25C05]"
                autoFocus
              />
              {pinError && <p role="alert" className="text-xs text-red-600 mt-1 font-medium">Code PIN incorrect. Veuillez réessayer.</p>}
            </div>
            <Button variant="primary" size="md" type="submit" className="w-full" isLoading={isUnlocking}>
              Déverrouiller l'accès
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const filteredPhotos = photos.filter((photo) => {
    if (onlyFavorites && !favorites.includes(photo.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = photo.photoNumber.toString().includes(q);
      const matchTags = photo.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchNum && !matchTags) return false;
    }
    return true;
  });

  const toggleFavorite = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => (prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]));
  };

  const handleGalleryTabChange = async (galleryId: string) => {
    setActiveGalleryId(galleryId);
    await loadPhotosForGallery(event, galleryId);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span className="font-semibold text-[#111827]">{event.photographerName}</span>
                <span>•</span>
                <span>{event.location}</span>
                <span>•</span>
                <span>{event.date}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">{event.title}</h1>
              {event.description && <p className="text-xs text-[#6B7280] mt-1 max-w-2xl">{event.description}</p>}
            </div>

            <div className="flex items-center gap-2">
              {user?.role === 'CLIENT' ? (
                <button
                  onClick={() => navigate('/mes-galeries')}
                  className="text-xs text-[#111827] bg-[#F8F9FA] hover:bg-gray-100 border border-[#E5E7EB] px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Mes galeries
                </button>
              ) : !user ? (
                <button
                  onClick={() => navigate('/connexion')}
                  className="text-xs text-[#6B7280] hover:text-[#F25C05] px-2 transition-colors cursor-pointer"
                >
                  Se connecter
                </button>
              ) : null}
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                }}
                className="text-xs text-[#111827] bg-[#F8F9FA] hover:bg-gray-100 border border-[#E5E7EB] px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> Partager
              </button>
              <Button variant="primary" size="sm" onClick={() => setIsCheckoutOpen(true)} icon={<ShoppingBag className="w-4 h-4" />}>
                Panier ({cart.length})
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-[#E5E7EB] bg-[#F8F9FA] sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => handleGalleryTabChange('all')}
                aria-current={activeGalleryId === 'all' ? 'true' : undefined}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeGalleryId === 'all' ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB] font-semibold' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Toutes ({event.photosCount})
              </button>
              {event.galleries.map((gal) => (
                <button
                  key={gal.id}
                  onClick={() => handleGalleryTabChange(gal.id)}
                  aria-current={activeGalleryId === gal.id ? 'true' : undefined}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeGalleryId === gal.id ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB] font-semibold' : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  {gal.name} ({gal.photoCount})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <label htmlFor="gallery-search" className="sr-only">Rechercher une photo par numéro ou tag</label>
                <input
                  id="gallery-search"
                  type="text"
                  placeholder="Recherche n°..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#F25C05]"
                />
              </div>
              <button
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                aria-pressed={onlyFavorites}
                aria-label={`Afficher uniquement mes favoris (${favorites.length})`}
                className={`text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                  onlyFavorites ? 'bg-red-50 text-red-600 border-red-200 font-semibold' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-red-600' : ''}`} />
                <span className="hidden sm:inline">Favoris ({favorites.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPhotos.length === 0 ? (
          <div className="text-center py-16 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]">
            <p className="text-sm font-semibold text-[#111827]">
              {photos.length === 0 ? "Aucune photo n'est encore disponible dans cette galerie." : 'Aucune photo ne correspond à votre filtre.'}
            </p>
            {photos.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setSearchQuery(''); setOnlyFavorites(false); }}
                className="mt-4"
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredPhotos.map((photo, index) => {
              const isFav = favorites.includes(photo.id);
              const inCart = isInCart(photo.id);
              return (
                <div
                  key={photo.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Agrandir la photo numéro ${photo.photoNumber}`}
                  onClick={() => setLightboxIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxIndex(index);
                    }
                  }}
                  className="group relative rounded-xl overflow-hidden bg-neutral-900 border border-[#E5E7EB] hover:border-gray-400 shadow-xs cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#F25C05] focus:ring-offset-2"
                >
                  <div className="aspect-4/3 relative overflow-hidden bg-neutral-100">
                    {photo.displayUrl && (
                      <img src={photo.displayUrl} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103" />
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      #{photo.photoNumber}
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(photo.id, e)}
                      aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      aria-pressed={isFav}
                      className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                        isFav ? 'bg-white text-red-500 shadow' : 'bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500' : ''}`} />
                    </button>
                    {photo.hdAvailable ? (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-white flex items-end justify-between">
                        <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Déjà achetée
                        </p>
                        <button
                          onClick={(e) => handleDownload(photo, e)}
                          disabled={downloadingPhotoId === photo.id}
                          aria-label="Télécharger en haute définition"
                          className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {downloadingPhotoId === photo.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-white flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-neutral-300 font-mono">{photo.priceCfa.toLocaleString('fr-FR')} FCFA (HD)</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({ photoId: photo.id, photoTitle: `Photo #${photo.photoNumber}`, thumbnailUrl: photo.thumbnailUrl, priceCfa: photo.priceCfa });
                          }}
                          aria-label={inCart ? 'Déjà dans le panier' : 'Ajouter au panier'}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${inCart ? 'bg-emerald-600 text-white' : 'bg-[#F25C05] hover:bg-[#D94F04] text-white'}`}
                        >
                          {inCart ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

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
                {cart.reduce((s, i) => s + i.priceCfa, 0).toLocaleString('fr-FR')} FCFA
              </p>
            </div>
          </button>
        </div>
      )}

      {lightboxIndex !== null && (
        <LightboxModal
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          photos={filteredPhotos}
          currentIndex={lightboxIndex}
          onNavigate={setLightboxIndex}
          event={event}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
        />
      )}

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} event={event} />
    </div>
  );
};
