import React, { useRef, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { EventDetail } from '../../types/api';
import { uploadPhotos } from '../../services/photos';
import { ApiError } from '../../lib/api';
import { UploadCloud, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PhotoUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetail;
  selectedGalleryId?: string;
  onUploaded?: () => void;
}

interface QueuedFile {
  file: File;
  previewUrl: string;
}

export const PhotoUploaderModal: React.FC<PhotoUploaderModalProps> = ({
  isOpen,
  onClose,
  event,
  selectedGalleryId,
  onUploaded,
}) => {
  const [galleryId, setGalleryId] = useState<string>(selectedGalleryId || event.galleries[0]?.id || '');
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ createdCount: number; errors: { filename: string; error: string }[] } | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items: QueuedFile[] = Array.from(files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setQueue((prev) => [...prev, ...items]);
    setResult(null);
    setError('');
  };

  const handleClose = () => {
    setQueue([]);
    setResult(null);
    setError('');
    setProgress(0);
    onClose();
  };

  const startUpload = async () => {
    if (queue.length === 0 || !galleryId) return;
    setIsUploading(true);
    setError('');
    try {
      const res = await uploadPhotos(
        event.id,
        galleryId,
        queue.map((q) => q.file),
        setProgress
      );
      setResult({ createdCount: res.created.length, errors: res.errors });
      setQueue([]);
      onUploaded?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || 'Échec de l\'envoi.' : 'Erreur réseau pendant l\'envoi.');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importation de photos"
      subtitle={`Événement : ${event.title} • Stockage privé, chaque photo est traitée (miniature, filigrane) après envoi`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        <div>
          <label htmlFor="upload-gallery" className="block text-xs font-semibold text-[#111827] mb-1">Sous-galerie de destination</label>
          <select
            id="upload-gallery"
            value={galleryId}
            onChange={(e) => setGalleryId(e.target.value)}
            disabled={isUploading}
            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none bg-white font-medium"
          >
            {event.galleries.map((gal) => (
              <option key={gal.id} value={gal.id}>
                {gal.name} ({gal.photoCount} photos actuelles)
              </option>
            ))}
          </select>
        </div>

        {queue.length === 0 && !result && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Choisir des photos à importer"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#F25C05] focus:ring-offset-2 ${
              isDragging ? 'border-[#F25C05] bg-[#FFF1EB]/40' : 'border-[#E5E7EB] hover:border-gray-400 bg-[#F8F9FA]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              aria-hidden="true"
              tabIndex={-1}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#F25C05] mx-auto mb-3 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#111827]">
              Glissez-déposez vos photos ici ou parcourez votre ordinateur
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              JPEG, PNG ou WebP, jusqu'à 50 Mo par fichier.
            </p>
          </div>
        )}

        <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] text-[11px] text-[#6B7280] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Traitement automatique :</strong> l'original reste privé — une miniature, un aperçu et une version filigranée sont générés après l'envoi.
          </span>
        </div>

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              <CheckCircle2 className="w-4 h-4" />
              {result.createdCount} photo{result.createdCount > 1 ? 's' : ''} envoyée{result.createdCount > 1 ? 's' : ''} — traitement en cours.
            </div>
            {result.errors.map((e, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{e.filename} — {e.error}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}

        {queue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#111827]">
                {queue.length} photo{queue.length > 1 ? 's' : ''} prêtes à l'envoi
              </span>
              {isUploading && <span className="font-mono font-bold text-[#F25C05]">{progress}%</span>}
            </div>

            {isUploading && (
              <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                <div className="bg-[#F25C05] h-full transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 gap-2 border border-[#E5E7EB] rounded-lg p-2 bg-[#F8F9FA]">
              {queue.map((q, idx) => (
                <img key={idx} src={q.previewUrl} alt="" className="w-full aspect-square object-cover rounded border border-[#E5E7EB]" />
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              {!isUploading ? (
                <>
                  <button type="button" onClick={() => setQueue([])} className="text-xs text-[#EF4444] hover:underline cursor-pointer">
                    Vider la file
                  </button>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleClose}>Annuler</Button>
                    <Button variant="primary" size="sm" onClick={startUpload} icon={<UploadCloud className="w-4 h-4" />}>
                      Envoyer ({queue.length} photos)
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-1 text-xs text-[#6B7280] flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
                  <span>Envoi en cours...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {result && (
          <div className="pt-2 border-t border-[#E5E7EB] flex justify-end">
            <Button variant="primary" size="sm" onClick={handleClose}>Fermer</Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
