import React, { useState, useEffect } from 'react';
import { Photo, Event } from '../../types';
import { WatermarkOverlay } from '../common/WatermarkOverlay';
import { Button } from '../common/Button';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ShoppingBag,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  event: Event;
  onOpenCheckout?: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onNavigate,
  event,
  onOpenCheckout,
}) => {
  const { addToCart, cart } = useApp();
  const [isZoomed, setIsZoomed] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
        onNavigate(currentIndex + 1);
      }
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onNavigate, onClose]);

  if (!isOpen || !currentPhoto) return null;

  const isInCart = cart.some((item) => item.photoId === currentPhoto.id);

  const handleDownloadPreview = () => {
    const a = document.createElement('a');
    a.href = currentPhoto.urlPreview;
    a.download = `${currentPhoto.filename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121212]/95 backdrop-blur-md flex flex-col justify-between select-none">
      {/* Top Controls */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 text-white z-20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-neutral-800 px-2.5 py-1 rounded text-[#F25C05] border border-neutral-700">
            #{currentPhoto.photoNumber}
          </span>
          <div>
            <h3 className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
              {currentPhoto.title}
            </h3>
            <p className="text-[11px] text-neutral-400 font-mono">
              {currentPhoto.filename} • {currentPhoto.width}×{currentPhoto.height} px • {(currentPhoto.sizeBytes / (1024 * 1024)).toFixed(1)} Mo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Watermark toggle preview */}
          {event.watermark.enabled && (
            <button
              onClick={() => setShowWatermark(!showWatermark)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                showWatermark
                  ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  : 'bg-[#FFF1EB] text-[#F25C05] border-orange-300 font-semibold'
              }`}
            >
              {showWatermark ? 'Filigrane actif' : 'Vue HD sans filigrane'}
            </button>
          )}

          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
            title="Zoomer"
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer ml-2"
            title="Fermer (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {/* Prev Arrow */}
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Center Canvas */}
        <div
          className={`relative max-h-full max-w-full transition-transform duration-200 ${
            isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <img
            src={currentPhoto.urlPreview}
            alt={currentPhoto.title}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl mx-auto"
          />

          {/* Watermark */}
          {event.watermark.enabled && showWatermark && (
            <WatermarkOverlay watermark={event.watermark} />
          )}
        </div>

        {/* Next Arrow */}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="px-6 py-4 bg-[#121212] border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 text-white">
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span>
            Photo {currentIndex + 1} sur {photos.length}
          </span>
          <span>•</span>
          <span className="text-[#F25C05] font-semibold">
            {currentPhoto.priceCFA.toLocaleString('fr-FR')} FCFA (Version HD Originale)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPreview}
            icon={<Download className="w-4 h-4" />}
          >
            Télécharger aperçu web
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              addToCart(currentPhoto, 'SINGLE');
              if (onOpenCheckout) onOpenCheckout();
            }}
            icon={isInCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          >
            {isInCart ? 'Ajoutée au panier (Commander)' : 'Commander cette photo HD'}
          </Button>
        </div>
      </div>
    </div>
  );
};
