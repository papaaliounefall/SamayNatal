import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { EventDetail, WatermarkPosition } from '../../types/api';
import { WatermarkOverlay } from '../common/WatermarkOverlay';
import { updateEvent } from '../../services/events';
import { ApiError } from '../../lib/api';

interface WatermarkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetail;
  onSaved?: (event: EventDetail) => void;
}

export const WatermarkSettingsModal: React.FC<WatermarkSettingsModalProps> = ({ isOpen, onClose, event, onSaved }) => {
  const [enabled, setEnabled] = useState(event.watermarkEnabled);
  const [text, setText] = useState(event.watermarkText);
  const [position, setPosition] = useState<WatermarkPosition>(event.watermarkPosition);
  const [opacity, setOpacity] = useState(event.watermarkOpacity);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const updated = await updateEvent(event.id, {
        watermarkEnabled: enabled,
        watermarkText: text,
        watermarkPosition: position,
        watermarkOpacity: opacity,
      });
      onSaved?.(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || 'Impossible d\'enregistrer.' : 'Erreur réseau.');
    } finally {
      setIsSaving(false);
    }
  };

  const watermarkPreview = { enabled, text, position, opacity };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filigrane & Protection d'images" subtitle={`Configuration pour l'événement : ${event.title}`} maxWidth="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between p-3 bg-[#F8F9FA] rounded-lg border border-[#E5E7EB]">
          <div>
            <p className="text-xs font-semibold text-[#111827]">Activer le filigrane automatique</p>
            <p className="text-[11px] text-[#6B7280]">
              Appliqué côté serveur sur les previews. Les versions HD achetées sont livrées sans filigrane.
            </p>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#F25C05] focus:ring-[#F25C05]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1.5">Aperçu (approximatif)</label>
          <div className="relative aspect-16/9 rounded-lg overflow-hidden border border-[#E5E7EB] bg-gradient-to-br from-neutral-800 to-neutral-900">
            {enabled && <WatermarkOverlay watermark={watermarkPreview} />}
          </div>
          <p className="text-[10px] text-[#6B7280] mt-1">
            Le rendu réel (opacité, police) est appliqué par le serveur lors du prochain traitement de photo.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1">Texte du filigrane</label>
          <input
            type="text"
            disabled={!enabled}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none uppercase font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1.5">Positionnement</label>
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
                disabled={!enabled}
                onClick={() => setPosition(pos.id as WatermarkPosition)}
                className={`text-xs py-2 px-1 rounded border text-center transition-colors cursor-pointer ${
                  position === pos.id ? 'border-[#F25C05] bg-[#FFF1EB] font-bold text-[#F25C05]' : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-gray-50'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-[#111827] mb-1">
            <span>Opacité du filigrane</span>
            <span className="font-mono text-[#F25C05]">{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            disabled={!enabled}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full accent-[#F25C05] cursor-pointer"
          />
        </div>

        {error && <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

        <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            Enregistrer les paramètres
          </Button>
        </div>
      </div>
    </Modal>
  );
};
