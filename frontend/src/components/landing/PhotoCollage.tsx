import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export interface CollageCard {
  src: string;
  alt: string;
  className: string;
  rotate: number;
  /** CSS object-position — most of these are landscape source photos
   * cropped into a portrait card, so centering isn't always where the
   * subject actually is. */
  position?: string;
}

interface PhotoCollageProps {
  cards: CollageCard[];
  /** Small thumbnails for the mock "gallery" preview card. */
  previewThumbs: string[];
}

/**
 * A one-time, staggered entrance (fade + slight rise) — not a looping
 * animation. The photos themselves are the point; this only settles them
 * into place quietly once, on load.
 */
export const PhotoCollage: React.FC<PhotoCollageProps> = ({ cards, previewThumbs }) => {
  return (
    <div className="relative h-[460px] w-full hidden lg:block" aria-hidden="true">
      {cards.map((card, i) => (
        <motion.div
          key={card.src}
          initial={{ opacity: 0, y: 24, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: card.rotate }}
          transition={{ duration: 0.7, delay: 0.15 * i, ease: 'easeOut' }}
          className={`absolute rounded-xl overflow-hidden shadow-xl border-4 border-white ${card.className}`}
        >
          <img
            src={card.src}
            alt={card.alt}
            className="w-full h-full object-cover"
            style={{ objectPosition: card.position || 'center' }}
          />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 * cards.length, ease: 'easeOut' }}
        className="absolute right-0 bottom-2 w-44 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] p-2.5"
      >
        <div className="flex items-center justify-between px-1 pb-1.5">
          <span className="text-[10px] font-bold text-[#111827]">Galerie</span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-[#E5E7EB]" />
            <span className="w-1 h-1 rounded-full bg-[#E5E7EB]" />
            <span className="w-1 h-1 rounded-full bg-[#E5E7EB]" />
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {previewThumbs.map((src, i) => (
            <img key={i} src={src} alt="" className="aspect-square object-cover rounded" />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 * cards.length + 0.3, ease: 'easeOut' }}
        className="absolute right-6 top-2 bg-[#111827] text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
      >
        <Sparkles className="w-3 h-3 text-[#F25C05]" />
        Votre galerie est prête
      </motion.div>
    </div>
  );
};
