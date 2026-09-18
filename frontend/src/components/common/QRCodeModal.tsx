import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from './Modal';
import { Button } from './Button';
import { Download, Printer, Copy, Check, MessageSquare, Maximize2, Lock } from 'lucide-react';
import { EventDetail } from '../../types/api';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventDetail;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, event }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  const galleryUrl = event.publicUrl;

  useEffect(() => {
    if (isOpen && galleryUrl) {
      QRCode.toDataURL(
        galleryUrl,
        { width: 600, margin: 2, color: { dark: '#111827', light: '#FFFFFF' }, errorCorrectionLevel: 'H' },
        (err, url) => {
          if (!err && url) setQrDataUrl(url);
        }
      );
    }
  }, [isOpen, galleryUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${event.slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Retrouvez toutes les photos de "${event.title}" sur la galerie officielle :\n${galleryUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrint = () => window.print();

  if (isProjectorMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#121212] text-white flex flex-col items-center justify-center p-8">
        <button
          onClick={() => setIsProjectorMode(false)}
          className="absolute top-6 right-6 text-gray-400 hover:text-white px-4 py-2 rounded-lg bg-neutral-800 text-sm font-medium cursor-pointer"
        >
          Quitter le mode écran plein
        </button>
        <div className="text-center max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">{event.title}</h1>
          <p className="text-neutral-400 text-base mb-8">Scannez pour retrouver vos photos</p>
          <div className="bg-white p-6 rounded-2xl inline-block shadow-2xl mx-auto border-4 border-[#F25C05]">
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code Galerie" className="w-72 h-72 sm:w-88 sm:h-88 mx-auto" />}
          </div>
          {event.privacy === 'CODE_PIN' && (
            <div className="mt-6 bg-neutral-900 border border-neutral-800 rounded-xl px-6 py-3 inline-flex items-center gap-2 text-sm text-neutral-400">
              <Lock className="w-4 h-4" /> Code d'accès requis — demandez-le à votre photographe
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Code & Partage de l'événement" subtitle={`Lien direct pour la galerie "${event.title}"`} maxWidth="md">
      <div className="space-y-6">
        <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-6 text-center print:border-none print:p-0">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05] bg-[#FFF1EB] px-2.5 py-0.5 rounded-full">
              Galerie Officielle
            </span>
          </div>
          <h4 className="font-semibold text-base text-[#111827]">{event.title}</h4>
          <p className="text-xs text-[#6B7280] mb-4">Scannez pour retrouver vos photos</p>

          <div className="bg-white p-3 rounded-lg border border-[#E5E7EB] inline-block shadow-xs">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR code pour ${event.title}`} className="w-48 h-48 mx-auto" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-50">
                <span className="text-xs text-gray-400">Génération du QR...</span>
              </div>
            )}
          </div>

          {event.privacy === 'CODE_PIN' && (
            <div className="mt-3 bg-white border border-[#E5E7EB] rounded-md px-3 py-1.5 inline-flex items-center gap-2 text-xs">
              <Lock className="w-3.5 h-3.5 text-[#6B7280]" />
              <span className="text-[#6B7280]">Code PIN requis (défini à la création de l'événement)</span>
            </div>
          )}

          <p className="text-[11px] text-[#6B7280] mt-3">{event.location} • {event.date}</p>
        </div>

        <div>
          <label htmlFor="gallery-link" className="block text-xs font-medium text-[#111827] mb-1.5">Lien d'accès client direct</label>
          <div className="flex gap-2">
            <input
              id="gallery-link"
              type="text"
              readOnly
              value={galleryUrl}
              className="bg-[#F8F9FA] border border-[#E5E7EB] text-xs rounded-md px-3 py-2 text-[#111827] flex-1 font-mono focus:outline-none select-all"
            />
            <Button
              variant={copied ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleCopyLink}
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copié !' : 'Copier'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Button variant="secondary" size="sm" onClick={handleDownloadQR} icon={<Download className="w-4 h-4" />}>
            Télécharger PNG
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            Imprimer l'affiche
          </Button>
          <Button variant="secondary" size="sm" onClick={handleWhatsAppShare} icon={<MessageSquare className="w-4 h-4 text-emerald-600" />} className="hover:border-emerald-500">
            Partager sur WhatsApp
          </Button>
          <Button variant="dark" size="sm" onClick={() => setIsProjectorMode(true)} icon={<Maximize2 className="w-4 h-4 text-[#F25C05]" />}>
            Mode Écran / Projecteur
          </Button>
        </div>
      </div>
    </Modal>
  );
};
