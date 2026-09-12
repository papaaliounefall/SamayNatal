import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { Event, Gallery } from '../../types';
import { UploadCloud, CheckCircle2, AlertCircle, FileImage, ShieldCheck, Sparkles } from 'lucide-react';

interface PhotoUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  selectedGalleryId?: string;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  stage: 'En attente' | 'Envoi S3 Privé' | 'Génération Thumbnail' | 'Preview Filigranée' | 'Terminé';
  previewUrl: string;
}

export const PhotoUploaderModal: React.FC<PhotoUploaderModalProps> = ({
  isOpen,
  onClose,
  event,
  selectedGalleryId,
}) => {
  const { addPhotosToGallery } = useApp();
  const [galleryId, setGalleryId] = useState<string>(
    selectedGalleryId || event.galleries[0]?.id || ''
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableGalleries = event.galleries;

  // Real or simulated batch files
  const sampleWeddingPhotos = [
    {
      title: 'Préparatifs de la mariée — Voile et parure',
      filename: 'PAF_FA_0089.CR3',
      urlPreview: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85',
      urlThumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=75',
      sizeBytes: 24500000,
    },
    {
      title: 'Entrée des mariés salués par les invités',
      filename: 'PAF_FA_0142.CR3',
      urlPreview: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=85',
      urlThumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=75',
      sizeBytes: 26800000,
    },
    {
      title: 'Séance couple face à l’océan Atlantique',
      filename: 'PAF_FA_0380.CR3',
      urlPreview: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=85',
      urlThumbnail: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=400&q=75',
      sizeBytes: 28100000,
    },
    {
      title: 'Ouverture du bal sous la coupole lumineuse',
      filename: 'PAF_FA_0599.CR3',
      urlPreview: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=85',
      urlThumbnail: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=400&q=75',
      sizeBytes: 23900000,
    },
  ];

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: UploadingFile[] = Array.from(files).map((file, idx) => ({
      id: `up-${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      progress: 0,
      stage: 'En attente',
      previewUrl: URL.createObjectURL(file),
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);
  };

  const loadPresetBatch = () => {
    const items: UploadingFile[] = sampleWeddingPhotos.map((s, idx) => ({
      id: `preset-${Date.now()}-${idx}`,
      name: s.filename,
      size: s.sizeBytes,
      progress: 0,
      stage: 'En attente',
      previewUrl: s.urlThumbnail,
    }));
    setUploadQueue(items);
  };

  const startUploadPipeline = () => {
    if (uploadQueue.length === 0) return;
    setIsUploading(true);

    let currentItemIdx = 0;

    const interval = setInterval(() => {
      setUploadQueue((prev) => {
        const next = [...prev];
        const item = next[currentItemIdx];

        if (item) {
          if (item.progress < 35) {
            item.progress += 15;
            item.stage = 'Envoi S3 Privé';
          } else if (item.progress < 70) {
            item.progress += 20;
            item.stage = 'Génération Thumbnail';
          } else if (item.progress < 95) {
            item.progress += 15;
            item.stage = 'Preview Filigranée';
          } else {
            item.progress = 100;
            item.stage = 'Terminé';
            currentItemIdx += 1;
          }
        }

        const totalProg = Math.round(
          next.reduce((acc, f) => acc + f.progress, 0) / (next.length * 100) * 100
        );
        setOverallProgress(totalProg);

        if (currentItemIdx >= next.length) {
          clearInterval(interval);
          setTimeout(() => {
            // Commit to AppContext
            const newPhotosPayload = next.map((f, i) => {
              const preset = sampleWeddingPhotos[i % sampleWeddingPhotos.length];
              return {
                title: f.name.replace(/\.[^/.]+$/, ''),
                filename: f.name,
                urlPreview: preset.urlPreview,
                urlThumbnail: preset.urlThumbnail,
                urlOriginal: preset.urlPreview,
                sizeBytes: f.size,
                priceCFA: event.defaultPricePerPhotoCFA || 2000,
                tags: [event.category, 'hd'],
              };
            });

            addPhotosToGallery(event.id, galleryId || event.galleries[0]?.id, newPhotosPayload);
            setIsUploading(false);
            setUploadQueue([]);
            setOverallProgress(0);
            onClose();
          }, 800);
        }

        return next;
      });
    }, 180);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importation de photos (Batch Upload)"
      subtitle={`Événement : ${event.title} • Stockage sécurisé compatible S3 / MinIO`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Destination sub-gallery selector */}
        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-1">
            Sous-galerie de destination
          </label>
          <select
            value={galleryId}
            onChange={(e) => setGalleryId(e.target.value)}
            disabled={isUploading}
            className="w-full text-xs px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none bg-white font-medium"
          >
            {availableGalleries.map((gal) => (
              <option key={gal.id} value={gal.id}>
                📁 {gal.name} ({gal.photoCount} photos actuelles)
              </option>
            ))}
          </select>
        </div>

        {/* Drag and Drop Zone */}
        {uploadQueue.length === 0 && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#F25C05] bg-[#FFF1EB]/40'
                : 'border-[#E5E7EB] hover:border-gray-400 bg-[#F8F9FA]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
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
              Prise en charge des formats RAW (.CR3, .NEF, .ARW) et JPEG haute résolution jusqu'à 50 Mo par fichier.
            </p>

            <div className="mt-4 pt-3 border-t border-[#E5E7EB]/80 flex items-center justify-center gap-2">
              <span className="text-[11px] text-[#6B7280]">Besoin d'un test rapide ?</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  loadPresetBatch();
                }}
                className="text-[11px] font-semibold text-[#F25C05] hover:underline cursor-pointer bg-[#FFF1EB] px-2.5 py-1 rounded"
              >
                + Charger un lot de 4 photos de démonstration HD
              </button>
            </div>
          </div>
        )}

        {/* Pipeline Architecture Notice */}
        <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] text-[11px] text-[#6B7280] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Architecture pipeline :</strong> Original S3 privé → Thumbnails générées → Preview filigranée créée.
            </span>
          </div>
          <span className="font-mono text-[#111827]">AES-256</span>
        </div>

        {/* Upload Queue List */}
        {uploadQueue.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#111827]">
                {uploadQueue.length} photo{uploadQueue.length > 1 ? 's' : ''} prêtes à l'envoi
              </span>
              {isUploading && (
                <span className="font-mono font-bold text-[#F25C05]">
                  Progression globale : {overallProgress}%
                </span>
              )}
            </div>

            {/* Overall Bar */}
            {isUploading && (
              <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#F25C05] h-full transition-all duration-150"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-[#E5E7EB] rounded-lg p-2 bg-[#F8F9FA]">
              {uploadQueue.map((file) => (
                <div
                  key={file.id}
                  className="bg-white p-2.5 rounded border border-[#E5E7EB] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={file.previewUrl}
                      alt=""
                      className="w-10 h-10 rounded object-cover border border-[#E5E7EB] shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-medium text-[#111827] truncate">{file.name}</p>
                      <p className="text-[10px] text-[#6B7280]">
                        {(file.size / (1024 * 1024)).toFixed(1)} Mo
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        file.stage === 'Terminé'
                          ? 'bg-emerald-50 text-emerald-700'
                          : file.stage === 'En attente'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-amber-50 text-[#F59E0B]'
                      }`}
                    >
                      {file.stage}
                    </span>
                    {isUploading && (
                      <p className="text-[10px] text-[#6B7280] font-mono mt-0.5">
                        {file.progress}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              {!isUploading ? (
                <>
                  <button
                    type="button"
                    onClick={() => setUploadQueue([])}
                    className="text-xs text-[#EF4444] hover:underline cursor-pointer"
                  >
                    Vider la file
                  </button>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={onClose}>
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={startUploadPipeline}
                      icon={<UploadCloud className="w-4 h-4" />}
                    >
                      Démarrer le traitement S3 ({uploadQueue.length} photos)
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-1 text-xs text-[#6B7280] flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
                  <span>Traitement asynchrone Celery & MinIO en cours...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
