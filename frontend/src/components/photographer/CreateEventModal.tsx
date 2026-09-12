import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { EventCategory, GalleryPrivacy } from '../../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (eventId: string) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const { createEvent, photographer } = useApp();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    location: 'Dakar, Sénégal',
    category: 'mariage' as EventCategory,
    privacy: 'PUBLIC' as GalleryPrivacy,
    accessPin: '',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
    defaultPricePerPhotoCFA: 2000,
    packPriceCFA: 15000,
    fullGalleryPriceCFA: 40000,
    watermarkText: `${photographer.businessName.toUpperCase()} © PROOF`,
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const newEvt = createEvent({
      title: formData.title,
      description: formData.description,
      date: formData.date,
      location: formData.location,
      category: formData.category,
      privacy: formData.privacy,
      accessPin: formData.privacy === 'CODE_PIN' ? formData.accessPin || '1234' : undefined,
      coverPhotoUrl: formData.coverPhotoUrl,
      defaultPricePerPhotoCFA: Number(formData.defaultPricePerPhotoCFA),
      packPriceCFA: Number(formData.packPriceCFA),
      fullGalleryPriceCFA: Number(formData.fullGalleryPriceCFA),
      watermark: {
        enabled: true,
        text: formData.watermarkText,
        position: 'center',
        opacity: 0.45,
      },
    });

    onClose();
    if (onEventCreated) {
      onEventCreated(newEvt.id);
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
          <label className="block text-xs font-semibold text-[#111827] mb-1">
            Titre de l'événement *
          </label>
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
            <label className="block text-xs font-semibold text-[#111827] mb-1">
              Catégorie *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
              className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">
              Date de la prise de vue *
            </label>
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
          <label className="block text-xs font-semibold text-[#111827] mb-1">
            Lieu de l'événement *
          </label>
          <input
            type="text"
            required
            placeholder="ex: Dakar, King Fahd Palace / Stadium Marius Ndiaye"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1">
            Description ou note aux invités
          </label>
          <textarea
            rows={2}
            placeholder="Informations sur la journée, remerciements ou consignes de téléchargement..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        {/* Privacy options */}
        <div className="pt-2 border-t border-[#E5E7EB]">
          <label className="block text-xs font-semibold text-[#111827] mb-2">
            Confidentialité de la galerie
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'PUBLIC', label: 'Publique', desc: 'Accessible via QR ou lien direct' },
              { id: 'CODE_PIN', label: 'Code PIN', desc: 'Protégée par 4 chiffres' },
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
                Définir le code PIN d'accès (ex: 2026)
              </label>
              <input
                type="text"
                maxLength={8}
                placeholder="2026"
                value={formData.accessPin}
                onChange={(e) => setFormData({ ...formData, accessPin: e.target.value })}
                className="w-36 text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none font-mono"
              />
            </div>
          )}
        </div>

        {/* Monetization Pricing */}
        <div className="pt-2 border-t border-[#E5E7EB]">
          <label className="block text-xs font-semibold text-[#111827] mb-2">
            Tarifs de vente client (FCFA)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-[#6B7280]">Photo individuelle HD</span>
              <input
                type="number"
                value={formData.defaultPricePerPhotoCFA}
                onChange={(e) => setFormData({ ...formData, defaultPricePerPhotoCFA: Number(e.target.value) })}
                className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280]">Pack 10 photos</span>
              <input
                type="number"
                value={formData.packPriceCFA}
                onChange={(e) => setFormData({ ...formData, packPriceCFA: Number(e.target.value) })}
                className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280]">Galerie complète</span>
              <input
                type="number"
                value={formData.fullGalleryPriceCFA}
                onChange={(e) => setFormData({ ...formData, fullGalleryPriceCFA: Number(e.target.value) })}
                className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Créer l'événement
          </Button>
        </div>
      </form>
    </Modal>
  );
};
