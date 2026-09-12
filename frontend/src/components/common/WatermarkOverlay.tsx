import React from 'react';
import { WatermarkPosition } from '../../types/api';

interface WatermarkOverlayProps {
  watermark: {
    enabled: boolean;
    text: string;
    position: WatermarkPosition;
    opacity: number;
  };
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({ watermark }) => {
  if (!watermark.enabled || !watermark.text) return null;

  const positionClasses = {
    center: 'items-center justify-center text-center',
    'bottom-right': 'items-end justify-end p-4 text-right',
    'bottom-left': 'items-end justify-start p-4 text-left',
    'top-right': 'items-start justify-end p-4 text-right',
    tile: 'items-center justify-center',
  };

  if (watermark.position === 'tile') {
    return (
      <div
        className="absolute inset-0 pointer-events-none flex flex-wrap items-center justify-around overflow-hidden select-none"
        style={{ opacity: watermark.opacity }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="text-white font-bold tracking-widest text-xs sm:text-sm -rotate-25 drop-shadow-md border border-white/20 px-2 py-1 uppercase"
          >
            {watermark.text}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex select-none ${positionClasses[watermark.position]}`}
      style={{ opacity: watermark.opacity }}
    >
      <div className="bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded text-white font-bold tracking-widest text-xs sm:text-sm uppercase drop-shadow-md border border-white/20">
        {watermark.text}
      </div>
    </div>
  );
};
