import React, { useEffect, useState } from 'react';
import { PublicPhoto, PublicEvent } from '../../types/api';
import { Button } from '../common/Button';
import { X, ChevronLeft, ChevronRight, ShoppingBag, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PublicPhoto[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  event: PublicEvent;
  onOpenCheckout?: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  photos,
  currentIndex,
  onNavigate,
  onOpenCheckout,
}) => {
  const { addToCart, isInCart } = useCart();
  const [isZoomed, setIsZoomed] = useState(false);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onNavigate, onClose]);

  if (!isOpen || !currentPhoto) return null;

  const inCart = isInCart(currentPhoto.id);

  return (
    <div className="fixed inset-0 z-50 bg-[#121212]/95 backdrop-blur-md flex flex-col justify-between select-none">
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 text-white z-20">
        <span className="text-xs font-mono font-bold bg-neutral-800 px-2.5 py-1 rounded text-[#F25C05] border border-neutral-700">
          #{currentPhoto.photoNumber}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
            title="Zoomer"
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer ml-2" title="Fermer (Échap)">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div
          className={`relative max-h-full max-w-full transition-transform duration-200 ${isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          {currentPhoto.displayUrl && (
            <img src={currentPhoto.displayUrl} alt="" className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl mx-auto" />
          )}
        </div>

        {currentIndex < photos.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="px-6 py-4 bg-[#121212] border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 text-white">
        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span>Photo {currentIndex + 1} sur {photos.length}</span>
          <span>•</span>
          <span className="text-[#F25C05] font-semibold">{currentPhoto.priceCfa.toLocaleString('fr-FR')} FCFA (Version HD Originale)</span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            addToCart({ photoId: currentPhoto.id, photoTitle: `Photo #${currentPhoto.photoNumber}`, thumbnailUrl: currentPhoto.thumbnailUrl, priceCfa: currentPhoto.priceCfa });
            onOpenCheckout?.();
          }}
          icon={inCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
        >
          {inCart ? 'Ajoutée au panier (Commander)' : 'Commander cette photo HD'}
        </Button>
      </div>
    </div>
  );
};
