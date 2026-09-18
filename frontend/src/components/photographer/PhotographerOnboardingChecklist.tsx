import React from 'react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { EventDetail, Wallet } from '../../types/api';
import { navigate } from '../../lib/router';

interface PhotographerOnboardingChecklistProps {
  events: EventDetail[];
  wallet: Wallet;
  onCreateEvent: () => void;
}

export const PhotographerOnboardingChecklist: React.FC<PhotographerOnboardingChecklistProps> = ({ events, wallet, onCreateEvent }) => {
  const hasEvent = events.length > 0;
  const hasPhotos = events.some((e) => e.photosCount > 0);
  const hasPublishedEvent = events.some((e) => e.status === 'ACTIF');
  const hasSale = wallet.entries.some((entry) => entry.entryType === 'SALE_CREDIT');

  if (hasEvent && hasPhotos && hasPublishedEvent && hasSale) return null;

  const firstEvent = events[0];
  const eventNeedingPublish = events.find((e) => e.status === 'BROUILLON') || firstEvent;

  const steps = [
    {
      done: hasEvent,
      title: 'Créez votre premier événement',
      description: "Un événement, c'est la galerie que vos clients verront — un mariage, un shooting, un match...",
      action: !hasEvent ? { label: 'Créer un événement', onClick: onCreateEvent } : undefined,
    },
    {
      done: hasPhotos,
      title: 'Importez vos photos',
      description: 'Chaque photo est traitée automatiquement : miniature, filigrane et version HD sécurisée.',
      action: hasEvent && !hasPhotos && firstEvent ? { label: 'Importer des photos', onClick: () => navigate(`/dashboard/evenements/${firstEvent.id}`) } : undefined,
    },
    {
      done: hasPublishedEvent,
      title: 'Publiez votre galerie',
      description: "Tant qu'un événement est en brouillon, il reste invisible — même avec le lien ou le QR code.",
      action: hasPhotos && !hasPublishedEvent && eventNeedingPublish ? { label: 'Publier la galerie', onClick: () => navigate(`/dashboard/evenements/${eventNeedingPublish.id}`) } : undefined,
    },
    {
      done: hasSale,
      title: 'Recevez votre première vente',
      description: 'Partagez le lien ou le QR code de votre galerie publiée : vos gains arrivent directement dans votre portefeuille.',
      action: undefined,
    },
  ];

  return (
    <div className="bg-[#121212] rounded-2xl p-6 sm:p-8 mb-8 text-white">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-4 h-4 text-[#F25C05]" />
        <h2 className="text-sm font-bold">Bienvenue — voici comment démarrer</h2>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            {step.done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-neutral-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className={`text-xs font-semibold ${step.done ? 'text-neutral-400 line-through' : 'text-white'}`}>{step.title}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 max-w-md">{step.description}</p>
              </div>
              {step.action && (
                <Button variant="primary" size="sm" onClick={step.action.onClick} className="shrink-0">
                  {step.action.label}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
