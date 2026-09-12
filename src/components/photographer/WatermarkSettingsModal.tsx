import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { Event, WatermarkConfig } from '../../types';
import { WatermarkOverlay } from '../common/WatermarkOverlay';

interface WatermarkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

export const WatermarkSettingsModal: React.FC<WatermarkSettingsModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { updateEventWatermark } = useApp();

  const [watermark, setWatermark] = useState<WatermarkConfig>(
    event.watermark || {
      enabled: true,
      text: `${event.photographerName.toUpperCase()} © PROOF`,
      position: 'center',
      opacity: 0.45,
    }
  );

  const handleSave = () => {
    updateEventWatermark(event.id, watermark);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filigrane & Protection d'images"
      subtitle={`Configuration pour l'événement : ${event.title}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between p-3 bg-[#F8F9FA] rounded-lg border border-[#E5E7EB]">
          <div>
            <p className="text-xs font-semibold text-[#111827]">Activer le filigrane automatique</p>
            <p className="text-[11px] text-[#6B7280]">
              Appliqué sur les previews web. Les versions HD achetées sont livrées sans filigrane.
            </p>
          </div>
          <input
            type="checkbox"
            checked={watermark.enabled}
            onChange={(e) => setWatermark({ ...watermark, enabled: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-[#F25C05] focus:ring-[#F25C05]"
          />
        </div>

        {/* Live Preview */}
        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1.5">
            Aperçu en direct
          </label>
          <div className="relative aspect-16/9 rounded-lg overflow-hidden border border-[#E5E7EB] bg-neutral-900">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {watermark.enabled && <WatermarkOverlay watermark={watermark} />}
          </div>
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1">
            Texte du filigrane
          </label>
          <input
            type="text"
            disabled={!watermark.enabled}
            value={watermark.text}
            onChange={(e) => setWatermark({ ...watermark, text: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none uppercase font-semibold"
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1.5">
            Positionnement
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 'center', label: 'Centre' },
              { id: 'bottom-right', label: 'Bas Droite' },
              { id: 'bottom-left', label: 'Bas Gauche' },
              { id: 'top-right', label: 'Haut Droite' },
              { id: 'tile', label: 'Mosaïque' },
            ].map((pos) => (
              <button
                type="button"
                key={pos.id}
                disabled={!watermark.enabled}
                onClick={() => setWatermark({ ...watermark, position: pos.id as any })}
                className={`text-xs py-2 px-1 rounded border text-center transition-colors cursor-pointer ${
                  watermark.position === pos.id
                    ? 'border-[#F25C05] bg-[#FFF1EB] font-bold text-[#F25C05]'
                    : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-gray-50'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Opacity slider */}
        <div>
          <div className="flex justify-between text-xs font-semibold text-[#111827] mb-1">
            <span>Opacité du filigrane</span>
            <span className="font-mono text-[#F25C05]">{Math.round(watermark.opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            disabled={!watermark.enabled}
            value={watermark.opacity}
            onChange={(e) => setWatermark({ ...watermark, opacity: parseFloat(e.target.value) })}
            className="w-full accent-[#F25C05] cursor-pointer"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Enregistrer les paramètres
          </Button>
        </div>
      </div>
    </Modal>
  );
};
