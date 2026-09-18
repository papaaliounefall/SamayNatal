import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { EventDetail, Photo } from '../../types/api';
import { updatePhoto } from '../../services/photos';
import { ApiError } from '../../lib/api';

interface PhotoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo;
  event: EventDetail;
  onSaved: (updated: Photo) => void;
}

export const PhotoEditModal: React.FC<PhotoEditModalProps> = ({ isOpen, onClose, photo, event, onSaved }) => {
  const [title, setTitle] = useState(photo.title);
  const [priceCfa, setPriceCfa] = useState(String(photo.priceCfa));
  const [tagsInput, setTagsInput] = useState(photo.tags.join(', '));
  const [galleryId, setGalleryId] = useState(photo.gallery);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    const parsedPrice = parseInt(priceCfa, 10);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Le prix doit être un nombre positif.');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updatePhoto(photo.id, {
        title,
        priceCfa: parsedPrice,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        gallery: galleryId,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || "Impossible d'enregistrer les modifications." : 'Erreur réseau.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier la photo" subtitle={photo.originalFilename} maxWidth="md">
      <div className="space-y-4">
        <div>
          <label htmlFor="photo-edit-title" className="block text-xs font-semibold text-[#111827] mb-1">Titre</label>
          <input
            id="photo-edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Sortie de la mairie"
            className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="photo-edit-price" className="block text-xs font-semibold text-[#111827] mb-1">Prix (F CFA)</label>
          <input
            id="photo-edit-price"
            type="number"
            min={0}
            step={100}
            value={priceCfa}
            onChange={(e) => setPriceCfa(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="photo-edit-tags" className="block text-xs font-semibold text-[#111827] mb-1">Tags (séparés par une virgule)</label>
          <input
            id="photo-edit-tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="ex: portrait, exterieur, ceremonie"
            className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="photo-edit-gallery" className="block text-xs font-semibold text-[#111827] mb-1">Galerie</label>
          <select
            id="photo-edit-gallery"
            value={galleryId}
            onChange={(e) => setGalleryId(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          >
            {event.galleries.map((gal) => (
              <option key={gal.id} value={gal.id}>
                {gal.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p role="alert" className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

        <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving}>
            Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
