import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

const SLIDE_SECONDS = 7;
const CROSSFADE_SECONDS = 2;

export interface HeroSlide {
  src: string;
  alt: string;
  /** CSS object-position, for portrait shots where the subject isn't centered. */
  position?: string;
}

/**
 * Slow, silent crossfade + Ken Burns drift between a few real photos,
 * meant to sit behind the Hero's text — not a "living gallery" showpiece.
 * Respects prefers-reduced-motion by dropping the zoom and slowing the
 * fade to a plain cut.
 */
export const HeroPhotoBackground: React.FC<{ slides: HeroSlide[] }> = ({ slides }) => {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[index];
  if (!current) return null;

  return (
    <div className="absolute inset-0 overflow-hidden bg-neutral-900" aria-hidden="true">
      <AnimatePresence mode="sync">
        <motion.img
          key={current.src}
          src={current.src}
          alt=""
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: reducedMotion ? 1 : 1.06 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: CROSSFADE_SECONDS, ease: 'easeInOut' },
            scale: { duration: SLIDE_SECONDS + CROSSFADE_SECONDS, ease: 'linear' },
          }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: current.position || 'center' }}
        />
      </AnimatePresence>
    </div>
  );
};
