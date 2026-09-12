import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { EventCategory, GalleryPrivacy } from '../../types/api';
import { createEvent } from '../../services/events';
import { ApiError } from '../../lib/api';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (eventId: string) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onEventCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    location: '',
    category: 'mariage' as EventCategory,
    privacy: 'PUBLIC' as GalleryPrivacy,
    accessPin: '',
    defaultPricePerPhotoCfa: 2000,
    packPriceCfa: 15000,
    fullGalleryPriceCfa: 40000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories: { id: EventCategory; label: string }[] = [
    { id: 'mariage', label: 'Mariage' },
    { id: 'sport', label: 'Sport' },
    { id: 'bapteme', label: 'Baptême' },
    { id: 'anniversaire', label: 'Anniversaire' },
    { id: 'evenement_religieux', label: 'Événement Religieux' },
    { id: 'concert', label: 'Concert' },
    { id: 'remise_diplome', label: 'Remise de Diplôme' },
    { id: 'ecole', label: 'École / Scolaire' },
    { id: 'entreprise', label: 'Entreprise / Séminaire' },
    { id: 'mode', label: 'Mode & Défilé' },
    { id: 'shooting_individuel', label: 'Shooting Individuel' },
    { id: 'evenement_public', label: 'Événement Public' },
    { id: 'artistique', label: 'Photographie Artistique' },
    { id: 'autre', label: 'Autre Événement' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    setError('');
    setIsSubmitting(true);

    try {
      const newEvt = await createEvent({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        location: formData.location,
        category: formData.category,
        privacy: formData.privacy,
        accessPin: formData.privacy === 'CODE_PIN' ? formData.accessPin : undefined,
        defaultPricePerPhotoCfa: Number(formData.defaultPricePerPhotoCfa),
        packPriceCfa: Number(formData.packPriceCfa),
        fullGalleryPriceCfa: Number(formData.fullGalleryPriceCfa),
      });
      onClose();
      onEventCreated?.(newEvt.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || 'Impossible de créer l\'événement.' : 'Erreur réseau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="+ Créer un événement"
      subtitle="Configurez les paramètres de diffusion et de confidentialité de votre galerie."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1">Titre de l'événement *</label>
          <input
            type="text"
            required
            placeholder="ex: Mariage Fatou & Abdou, Finale Coupe du Sénégal..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Catégorie *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
              className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Date de la prise de vue *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1">Lieu de l'événement</label>
          <input
            type="text"
            placeholder="ex: Dakar, King Fahd Palace / Stadium Marius Ndiaye"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1">Description ou note aux invités</label>
          <textarea
            rows={2}
            placeholder="Informations sur la journée, remerciements ou consignes de téléchargement..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        <div className="pt-2 border-t border-[#E5E7EB]">
          <label className="block text-xs font-semibold text-[#111827] mb-2">Confidentialité de la galerie</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'PUBLIC', label: 'Publique', desc: 'Accessible via QR ou lien direct' },
              { id: 'CODE_PIN', label: 'Code PIN', desc: 'Protégée par un code' },
              { id: 'PRIVE', label: 'Privée', desc: 'Sur invitation directe uniquement' },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setFormData({ ...formData, privacy: p.id as GalleryPrivacy })}
                className={`p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                  formData.privacy === p.id
                    ? 'border-[#F25C05] bg-[#FFF1EB] font-medium text-[#111827]'
                    : 'border-[#E5E7EB] bg-[#F8F9FA] text-[#6B7280]'
                }`}
              >
                <p className="font-semibold">{p.label}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">{p.desc}</p>
              </div>
            ))}
          </div>

          {formData.privacy === 'CODE_PIN' && (
            <div className="mt-3">
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Définir le code PIN d'accès
              </label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="ex: 2026"
                value={formData.accessPin}
                onChange={(e) => setFormData({ ...formData, accessPin: e.target.value })}
                className="w-36 text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none font-mono"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Notez ce code : il est chiffré et ne pourra plus être affiché en clair par la suite.
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-[#E5E7EB]">
          <label className="block text-xs font-semibold text-[#111827] mb-2">Tarifs de vente client (FCFA)</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-[#6B7280]">Photo individuelle HD</span>
              <input
                type="number"
                min={0}
                value={formData.defaultPricePerPhotoCfa}
                onChange={(e) => setFormData({ ...formData, defaultPricePerPhotoCfa: Number(e.target.value) })}
                className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280]">Pack (prix forfaitaire)</span>
              <input
                type="number"
                min={0}
                value={formData.packPriceCfa}
                onChange={(e) => setFormData({ ...formData, packPriceCfa: Number(e.target.value) })}
                className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280]">Galerie complète</span>
              <input
                type="number"
                min={0}
                value={formData.fullGalleryPriceCfa}
                onChange={(e) => setFormData({ ...formData, fullGalleryPriceCfa: Number(e.target.value) })}
                className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
            Créer l'événement
          </Button>
        </div>
      </form>
    </Modal>
  );
};
