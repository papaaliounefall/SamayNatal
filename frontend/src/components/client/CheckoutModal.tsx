import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { PublicEvent, PaymentMethod, Order } from '../../types/api';
import { createOrder, devConfirmPayment } from '../../services/orders';
import { requestHdDownload } from '../../services/photos';
import { ApiError } from '../../lib/api';
import { navigate } from '../../lib/router';
import { CreditCard, Smartphone, CheckCircle2, Download, ShieldCheck, FlaskConical, UserPlus } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PublicEvent;
}

const IS_SANDBOX = Boolean(import.meta.env.DEV);

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, event }) => {
  const { cart, removeFromCart, clearCart, totalCfa } = useCart();
  const { user, registerClient } = useAuth();

  const [step, setStep] = useState<'review' | 'payment' | 'pending' | 'success'>('review');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('WAVE');
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [providerReference, setProviderReference] = useState('');
  const [downloadUrls, setDownloadUrls] = useState<{ label: string; url: string }[]>([]);

  const [accountPassword, setAccountPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);

  const paymentProviders: { id: PaymentMethod; label: string; sub: string; iconColor: string }[] = [
    { id: 'WAVE', label: 'Wave Mobile Money', sub: 'Sénégal & Côte d\'Ivoire', iconColor: 'text-[#1E90FF]' },
    { id: 'ORANGE_MONEY', label: 'Orange Money', sub: 'Valider via code USSD ou notification OM', iconColor: 'text-[#FF7900]' },
    { id: 'FREE_MONEY', label: 'Free Money', sub: 'Paiement mobile sécurisé', iconColor: 'text-emerald-600' },
    { id: 'CARTE_BANCAIRE', label: 'Carte Bancaire (Visa / Mastercard)', sub: 'Transaction 3D-Secure', iconColor: 'text-[#111827]' },
  ];

  const handleCreateOrder = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const result = await createOrder(event.slug, {
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone,
        paymentMethod: selectedMethod,
        cartItems: cart.map((c) => ({ itemType: 'SINGLE', photoId: c.photoId })),
        idempotencyKey: `${event.slug}-${clientInfo.email}-${Date.now()}`,
      });
      setOrder(result.order);
      setProviderReference(result.payment.providerReference);
      setStep('pending');
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || 'Impossible de créer la commande.' : 'Erreur réseau.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSandboxConfirm = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const confirmed = await devConfirmPayment(providerReference, true);
      setOrder(confirmed);
      const urls = await Promise.all(
        confirmed.items
          .filter((item) => item.photo)
          .map(async (item) => {
            const res = await requestHdDownload(item.photo as string, confirmed.clientEmail);
            return { label: item.titleSnapshot, url: res.downloadUrl };
          })
      );
      setDownloadUrls(urls);
      clearCart();
      setStep('success');
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || 'Paiement non confirmé.' : 'Erreur réseau.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsCreatingAccount(true);
    setAccountError('');
    try {
      await registerClient({
        email: order.clientEmail,
        password: accountPassword,
        firstName: order.clientName,
        lastName: '',
      });
      setAccountCreated(true);
    } catch (err) {
      if (err instanceof ApiError && err.data && typeof err.data === 'object') {
        const messages = Object.values(err.data as Record<string, unknown>).flat().map(String);
        setAccountError(messages[0] || 'Impossible de créer le compte.');
      } else {
        setAccountError('Impossible de créer le compte. Veuillez réessayer.');
      }
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const handleClose = () => {
    setStep('review');
    setError('');
    setOrder(null);
    onClose();
  };

  if (cart.length === 0 && step === 'review') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Votre Panier" maxWidth="md">
        <div className="py-8 text-center">
          <p className="text-xs text-[#6B7280]">Votre sélection de photos est vide.</p>
          <Button variant="secondary" size="sm" onClick={handleClose} className="mt-4">Retourner à la galerie</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'success' ? 'Commande validée avec succès' : `Finaliser votre commande (${cart.length} photo${cart.length > 1 ? 's' : ''})`}
      subtitle={step === 'success' ? `Reçu n° ${order?.orderNumber} • Téléchargement HD activé` : `Événement : ${event.title} • Photos haute définition sans filigrane`}
      maxWidth="lg"
    >
      {step === 'review' && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-2">Photos sélectionnées</label>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border border-[#E5E7EB] rounded-lg p-2 bg-[#F8F9FA]">
              {cart.map((item) => (
                <div key={item.photoId} className="bg-white p-2 rounded border border-[#E5E7EB] flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    {item.thumbnailUrl && <img src={item.thumbnailUrl} alt="" className="w-10 h-10 rounded object-cover border border-[#E5E7EB]" />}
                    <p className="font-semibold text-[#111827]">{item.photoTitle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-[#111827]">{item.priceCfa.toLocaleString('fr-FR')} F</span>
                    <button
                      onClick={() => removeFromCart(item.photoId)}
                      aria-label={`Retirer ${item.photoTitle} du panier`}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
            <label id="checkout-contact-group" className="block text-xs font-semibold text-[#111827]">Coordonnées de réception des liens de téléchargement</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="group" aria-labelledby="checkout-contact-group">
              <div>
                <label htmlFor="checkout-name" className="text-[10px] text-[#6B7280]">Nom complet *</label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5 focus:outline-none focus:border-[#F25C05]"
                />
              </div>
              <div>
                <label htmlFor="checkout-email" className="text-[10px] text-[#6B7280]">Email de réception *</label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5 focus:outline-none focus:border-[#F25C05]"
                />
              </div>
              <div>
                <label htmlFor="checkout-phone" className="text-[10px] text-[#6B7280]">Téléphone (WhatsApp) *</label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded mt-0.5 focus:outline-none focus:border-[#F25C05]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] text-xs">
            <div className="flex justify-between font-bold text-[#111827] text-sm">
              <span>Total à régler</span>
              <span className="font-mono text-[#F25C05]">{totalCfa.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <p className="text-[10px] text-[#6B7280] mt-1">
              La répartition commission / gain photographe est calculée par la plateforme à la création de la commande.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="sm" onClick={handleClose}>Continuer à explorer</Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!clientInfo.name || !clientInfo.email || !clientInfo.phone}
              onClick={() => setStep('payment')}
              icon={<CreditCard className="w-4 h-4" />}
            >
              Choisir le mode de règlement ({totalCfa.toLocaleString('fr-FR')} F)
            </Button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-5">
          <div>
            <label id="checkout-payment-group" className="block text-xs font-semibold text-[#111827] mb-2">Sélectionnez votre moyen de paiement</label>
            <div className="space-y-2" role="radiogroup" aria-labelledby="checkout-payment-group">
              {paymentProviders.map((provider) => (
                <div
                  key={provider.id}
                  role="radio"
                  aria-checked={selectedMethod === provider.id}
                  tabIndex={0}
                  onClick={() => setSelectedMethod(provider.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedMethod(provider.id);
                    }
                  }}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-[#F25C05] focus:ring-offset-2 ${
                    selectedMethod === provider.id ? 'border-[#F25C05] bg-[#FFF1EB]/50 ring-1 ring-[#F25C05]' : 'border-[#E5E7EB] hover:bg-gray-50'
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
                    {selectedMethod === provider.id && <div className="w-2 h-2 rounded-full bg-[#F25C05]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <ShieldCheck className="w-4 h-4" /> Le paiement n'est confirmé que par le fournisseur, jamais par ce navigateur.
          </div>

          {error && <p role="alert" className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

          <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB]">
            <Button variant="secondary" size="sm" onClick={() => setStep('review')} disabled={isProcessing}>Retour au panier</Button>
            <Button variant="primary" size="sm" onClick={handleCreateOrder} isLoading={isProcessing}>
              Confirmer et Payer {totalCfa.toLocaleString('fr-FR')} FCFA
            </Button>
          </div>
        </div>
      )}

      {step === 'pending' && order && (
        <div className="text-center space-y-6 py-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Smartphone className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#111827]">En attente de confirmation du paiement</h3>
            <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
              Commande <strong>{order.orderNumber}</strong> créée. Validez la demande envoyée sur votre mobile ({clientInfo.phone}).
            </p>
          </div>

          {IS_SANDBOX && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4" /> Mode sandbox (développement)
              </p>
              <p className="text-[11px] text-amber-700">
                Aucune passerelle Wave/Orange Money/carte n'est encore branchée. Ce bouton simule le webhook que
                le fournisseur enverrait une fois le paiement réellement effectué.
              </p>
              <Button variant="primary" size="sm" onClick={handleSandboxConfirm} isLoading={isProcessing} className="w-full">
                Simuler la confirmation du paiement
              </Button>
            </div>
          )}

          {error && <p role="alert" className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
        </div>
      )}

      {step === 'success' && order && (
        <div className="text-center space-y-6 py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#111827]">Paiement validé avec succès !</h3>
            <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
              Merci {order.clientName}. Vos photos haute résolution originales sont débloquées sans filigrane.
            </p>
          </div>

          <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB] text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between"><span className="text-[#6B7280]">Référence reçu :</span><span className="font-bold text-[#111827]">{order.orderNumber}</span></div>
            <div className="flex justify-between"><span className="text-[#6B7280]">Moyen utilisé :</span><span className="text-[#111827]">{order.paymentMethod}</span></div>
            <div className="flex justify-between pt-1 border-t border-[#E5E7EB]"><span className="text-[#6B7280]">Montant payé :</span><span className="font-bold text-[#F25C05]">{order.totalAmountCfa.toLocaleString('fr-FR')} FCFA</span></div>
          </div>

          <div className="space-y-2 text-left">
            <label className="block text-xs font-semibold text-[#111827]">Liens de téléchargement sécurisés (temporaires)</label>
            <div className="space-y-1.5">
              {downloadUrls.map((dl, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-[#E5E7EB] flex items-center justify-between text-xs">
                  <span className="font-medium text-[#111827] truncate">{dl.label}</span>
                  <a href={dl.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F25C05] bg-[#FFF1EB] hover:bg-orange-100 px-2.5 py-1 rounded transition-colors">
                    <Download className="w-3.5 h-3.5" /> Télécharger
                  </a>
                </div>
              ))}
            </div>
          </div>

          {!user && !accountCreated && (
            <div className="bg-[#FFF1EB] border border-orange-200 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-[#111827] flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#F25C05]" /> Créer un compte gratuit
              </p>
              <p className="text-[11px] text-[#6B7280]">
                Retrouvez toutes vos galeries achetées au même endroit, sans jamais perdre ce lien.
              </p>
              <form onSubmit={handleCreateAccount} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  required
                  minLength={10}
                  placeholder="Mot de passe (10 caractères min.)"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="flex-1 text-xs px-2.5 py-1.5 border border-[#E5E7EB] rounded focus:outline-none focus:border-[#F25C05]"
                />
                <Button type="submit" variant="primary" size="sm" isLoading={isCreatingAccount}>
                  Créer mon compte
                </Button>
              </form>
              {accountError && <p role="alert" className="text-[11px] text-red-600 font-medium">{accountError}</p>}
              <p className="text-[10px] text-[#6B7280]">Compte associé à {order.clientEmail}</p>
            </div>
          )}

          {accountCreated && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
              <p className="text-xs font-semibold text-emerald-800">Compte créé avec succès !</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  handleClose();
                  navigate('/mes-galeries');
                }}
              >
                Voir mes galeries
              </Button>
            </div>
          )}

          <div className="pt-4 border-t border-[#E5E7EB]">
            <Button variant="primary" size="md" onClick={handleClose} className="w-full">Fermer et retourner à la galerie</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
