import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PayoutMethod } from '../../types/api';
import { requestPayout } from '../../services/photographers';
import { ApiError } from '../../lib/api';

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalanceCfa: number;
  onRequested: () => void;
}

const METHODS: { id: PayoutMethod; label: string }[] = [
  { id: 'WAVE', label: 'Wave' },
  { id: 'ORANGE_MONEY', label: 'Orange Money' },
  { id: 'FREE_MONEY', label: 'Free Money' },
];

export const PayoutRequestModal: React.FC<PayoutRequestModalProps> = ({ isOpen, onClose, availableBalanceCfa, onRequested }) => {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PayoutMethod>('WAVE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amountCfa = parseInt(amount, 10);
    if (Number.isNaN(amountCfa) || amountCfa <= 0) {
      setError('Le montant doit être un nombre positif.');
      return;
    }
    if (amountCfa > availableBalanceCfa) {
      setError(`Le montant dépasse votre solde disponible (${availableBalanceCfa.toLocaleString('fr-FR')} F CFA).`);
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Indiquez le numéro qui recevra le versement.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPayout({ amountCfa, method, phoneNumber });
      setAmount('');
      setPhoneNumber('');
      onRequested();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || 'Impossible de soumettre la demande de retrait.' : 'Erreur réseau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Demander un retrait" subtitle="Le versement est traité manuellement par l'administration." maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] text-xs flex justify-between">
          <span className="text-[#6B7280]">Solde disponible</span>
          <span className="font-mono font-bold text-[#111827]">{availableBalanceCfa.toLocaleString('fr-FR')} F CFA</span>
        </div>

        <div>
          <label htmlFor="payout-amount" className="block text-xs font-semibold text-[#111827] mb-1">Montant à retirer (F CFA)</label>
          <input
            id="payout-amount"
            type="number"
            min={1}
            max={availableBalanceCfa}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        <div>
          <label id="payout-method-group" className="block text-xs font-semibold text-[#111827] mb-1.5">Moyen de réception</label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="payout-method-group">
            {METHODS.map((m) => (
              <div
                key={m.id}
                role="radio"
                aria-checked={method === m.id}
                tabIndex={0}
                onClick={() => setMethod(m.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setMethod(m.id);
                  }
                }}
                className={`p-2 rounded-lg border cursor-pointer text-xs text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#F25C05] focus:ring-offset-1 ${
                  method === m.id ? 'border-[#F25C05] bg-[#FFF1EB] font-semibold text-[#111827]' : 'border-[#E5E7EB] bg-white text-[#6B7280]'
                }`}
              >
                {m.label}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="payout-phone" className="block text-xs font-semibold text-[#111827] mb-1">Numéro qui recevra le versement</label>
          <input
            id="payout-phone"
            type="tel"
            required
            placeholder="+221 77 000 00 00"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        {error && <p role="alert" className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

        <div className="pt-2 border-t border-[#E5E7EB] flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>Envoyer la demande</Button>
        </div>
      </form>
    </Modal>
  );
};
