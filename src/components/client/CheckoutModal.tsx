import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { Event, PaymentMethod } from '../../types';
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  Download,
  ShieldCheck,
  Receipt,
  FileCheck,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { cart, removeFromCart, clearCart, createOrder } = useApp();

  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('WAVE');
  const [clientInfo, setClientInfo] = useState({
    name: 'Awa Diop',
    email: 'awa.diop@gmail.com',
    phone: '+221 77 555 12 34',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Calculate pricing
  const totalAmountCFA = cart.reduce((sum, item) => sum + item.priceCFA, 0);
  const platformFeeCFA = Math.round(totalAmountCFA * 0.15); // 15% platform commission
  const photographerEarningsCFA = totalAmountCFA - platformFeeCFA;

  const paymentProviders: { id: PaymentMethod; label: string; sub: string; iconColor: string }[] = [
    { id: 'WAVE', label: 'Wave Mobile Money', sub: 'Paiement instantané à 1% • Sénégal & Côte d’Ivoire', iconColor: 'text-[#1E90FF]' },
    { id: 'ORANGE_MONEY', label: 'Orange Money', sub: 'Valider via code USSD #144# ou notification OM', iconColor: 'text-[#FF7900]' },
    { id: 'FREE_MONEY', label: 'Free Money', sub: 'Paiement mobile sécurisé', iconColor: 'text-emerald-600' },
    { id: 'CARTE_BANCAIRE', label: 'Carte Bancaire (Visa / Mastercard)', sub: 'Transaction 3D-Secure internationale', iconColor: 'text-[#111827]' },
  ];

  const handleProcessPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const order = createOrder({
        eventId: event.id,
        photographerId: event.photographerId,
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone,
        totalAmountCFA,
        platformFeeCFA,
        photographerEarningsCFA,
        paymentMethod: selectedMethod,
        items: cart.map((c) => ({
          photoId: c.photoId,
          type: c.type,
          priceCFA: c.priceCFA,
        })),
      });

      setCompletedOrder(order);
      setIsProcessing(false);
      setStep('success');
      clearCart();
    }, 1500);
  };

  if (cart.length === 0 && step !== 'success') {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Votre Panier" maxWidth="md">
        <div className="py-8 text-center">
          <p className="text-xs text-[#6B7280]">Votre sélection de photos est vide.</p>
          <Button variant="secondary" size="sm" onClick={onClose} className="mt-4">
            Retourner à la galerie
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'success'
          ? 'Commande validée avec succès'
          : `Finaliser votre commande (${cart.length} photo${cart.length > 1 ? 's' : ''})`
      }
      subtitle={
        step === 'success'
          ? `Reçu n° ${completedOrder?.orderNumber} • Téléchargement HD activé`
          : `Événement : ${event.title} • Photos haute définition sans filigrane`
      }
      maxWidth="lg"
    >
      {step === 'review' && (
        <div className="space-y-5">
          {/* Photos list in cart */}
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-2">
              Photos sélectionnées
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-[#E5E7EB] rounded-lg p-2 bg-[#F8F9FA]">
              {cart.map((item) => (
                <div
                  key={item.photoId}
                  className="bg-white p-2 rounded border border-[#E5E7EB] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.photoThumbnail}
                      alt={item.photoTitle}
                      className="w-10 h-10 rounded object-cover border border-[#E5E7EB]"
                    />
                    <div>
                      <p className="font-semibold text-[#111827]">{item.photoTitle}</p>
                      <p className="text-[10px] text-[#6B7280]">Résolution HD d'origine</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[#111827]">
                      {item.priceCFA.toLocaleString('fr-FR')} F
                    </span>
                    <button
                      onClick={() => removeFromCart(item.photoId)}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer font-bold px-1"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
            <label className="block text-xs font-semibold text-[#111827]">
              Coordonnées de réception des liens de téléchargement
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-[#6B7280]">Nom complet *</span>
                <input
                  type="text"
                  required
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5 focus:outline-none focus:border-[#F25C05]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280]">Email de réception *</span>
                <input
                  type="email"
                  required
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5 focus:outline-none focus:border-[#F25C05]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280]">Téléphone (WhatsApp) *</span>
                <input
                  type="tel"
                  required
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5 focus:outline-none focus:border-[#F25C05]"
                />
              </div>
            </div>
          </div>

          {/* Transparent SaaS Financial Breakdown */}
          <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] text-xs space-y-1.5">
            <div className="flex justify-between text-[#6B7280]">
              <span>Sous-total ({cart.length} photos)</span>
              <span className="font-mono">{totalAmountCFA.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#6B7280]">
              <span>Revenu net réservé au photographe (85%)</span>
              <span className="font-mono text-emerald-700">{photographerEarningsCFA.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#6B7280]">
              <span>Frais de service & infrastructure sécurisée (15%)</span>
              <span className="font-mono">{platformFeeCFA.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="pt-2 border-t border-[#E5E7EB] flex justify-between font-bold text-[#111827] text-sm">
              <span>Total à régler</span>
              <span className="font-mono text-[#F25C05]">
                {totalAmountCFA.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Continuer à explorer
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep('payment')}
              icon={<CreditCard className="w-4 h-4" />}
            >
              Choisir le mode de règlement ({totalAmountCFA.toLocaleString('fr-FR')} F)
            </Button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-2">
              Sélectionnez votre moyen de paiement
            </label>
            <div className="space-y-2">
              {paymentProviders.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => setSelectedMethod(provider.id)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    selectedMethod === provider.id
                      ? 'border-[#F25C05] bg-[#FFF1EB]/50 ring-1 ring-[#F25C05]'
                      : 'border-[#E5E7EB] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className={`w-5 h-5 ${provider.iconColor}`} />
                    <div>
                      <p className="text-xs font-bold text-[#111827]">{provider.label}</p>
                      <p className="text-[11px] text-[#6B7280]">{provider.sub}</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center">
                    {selectedMethod === provider.id && (
                      <div className="w-2 h-2 rounded-full bg-[#F25C05]" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment execution box */}
          <div className="p-4 bg-[#F8F9FA] rounded-xl border border-[#E5E7EB] text-center space-y-2">
            <p className="text-xs font-semibold text-[#111827]">
              Validation sécurisée via {selectedMethod.replace('_', ' ')}
            </p>
            <p className="text-[11px] text-[#6B7280]">
              Un code de validation ou une demande d'approbation instantanée sera envoyée sur votre mobile ({clientInfo.phone}).
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" /> Chiffrement bancaire SSL / TLS 256 bits
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setStep('review')}
              disabled={isProcessing}
            >
              Retour au panier
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleProcessPayment}
              disabled={isProcessing}
            >
              {isProcessing ? 'Validation en cours...' : `Confirmer et Payer ${totalAmountCFA.toLocaleString('fr-FR')} FCFA`}
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && completedOrder && (
        <div className="text-center space-y-6 py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#111827]">Paiement validé avec succès !</h3>
            <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
              Merci {completedOrder.clientName}. Vos photos haute résolution originales sont débloquées sans filigrane.
            </p>
          </div>

          {/* Transaction receipt summary */}
          <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB] text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Référence reçu :</span>
              <span className="font-bold text-[#111827]">{completedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Moyen utilisé :</span>
              <span className="text-[#111827]">{completedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Photos débloquées :</span>
              <span className="text-[#111827]">{completedOrder.items.length} fichiers HD originaux</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#E5E7EB]">
              <span className="text-[#6B7280]">Montant payé :</span>
              <span className="font-bold text-[#F25C05]">
                {completedOrder.totalAmountCFA.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Secure Download Links */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-semibold text-[#111827]">
              Liens de téléchargement sécurisés (valables 7 jours)
            </label>
            <div className="space-y-1.5">
              {completedOrder.downloadUrls.map((dl: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-lg border border-[#E5E7EB] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-[#111827]">Fichier original #{idx + 1} (HD)</span>
                  </div>
                  <a
                    href={dl.url}
                    download
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F25C05] bg-[#FFF1EB] hover:bg-orange-100 px-2.5 py-1 rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Télécharger
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB]">
            <Button variant="primary" size="md" onClick={onClose} className="w-full">
              Fermer et retourner à la galerie
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
