import React, { useEffect, useState } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, Settings2, Send } from 'lucide-react';
import { PhotographerLayout } from './PhotographerLayout';
import { PayoutRequestModal } from './PayoutRequestModal';
import { Button } from '../common/Button';
import { LedgerEntry, PayoutRequest, Wallet } from '../../types/api';
import { fetchAvailablePayoutBalance, fetchMyPayouts } from '../../services/photographers';

const ENTRY_LABELS: Record<LedgerEntry['entryType'], string> = {
  SALE_CREDIT: 'Vente créditée',
  COMMISSION_DEBIT: 'Commission plateforme',
  PAYOUT: 'Versement',
  ADJUSTMENT: 'Ajustement manuel',
};

const PAYOUT_STATUS_STYLES: Record<PayoutRequest['status'], string> = {
  EN_ATTENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  PAYE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJETE: 'bg-red-50 text-red-600 border-red-200',
};

const PAYOUT_METHOD_LABELS: Record<PayoutRequest['method'], string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
};

const formatCfa = (amount: number) => `${amount.toLocaleString('fr-FR')} F CFA`;

const WalletContent: React.FC<{ wallet: Wallet; refetch: () => void }> = ({ wallet, refetch }) => {
  const [availableBalanceCfa, setAvailableBalanceCfa] = useState<number | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payoutLoadError, setPayoutLoadError] = useState(false);

  const loadPayoutData = () => {
    setPayoutLoadError(false);
    Promise.all([fetchAvailablePayoutBalance(), fetchMyPayouts()])
      .then(([balance, payoutPage]) => {
        setAvailableBalanceCfa(balance.availableBalanceCfa);
        setPayouts(payoutPage.results);
      })
      .catch(() => setPayoutLoadError(true));
  };

  useEffect(() => {
    loadPayoutData();
  }, []);

  const handleRequested = () => {
    loadPayoutData();
    refetch();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">Portefeuille</h1>
          <p className="text-xs text-[#6B7280] mt-1">Historique de vos gains, commissions et versements.</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)} icon={<Send className="w-4 h-4" />}>
          Demander un retrait
        </Button>
      </div>

      <div className="py-8 border-b border-[#E5E7EB]">
        <div className="bg-[#121212] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <WalletIcon className="w-3.5 h-3.5" /> Solde du portefeuille
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-2 font-mono">{formatCfa(wallet.balanceCfa)}</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Mis à jour le {new Date(wallet.updatedAt).toLocaleString('fr-FR')}
            </p>
          </div>
          {availableBalanceCfa !== null && availableBalanceCfa !== wallet.balanceCfa && (
            <div className="sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Disponible au retrait</p>
              <p className="text-xl font-bold text-amber-300 mt-1 font-mono">{formatCfa(availableBalanceCfa)}</p>
              <p className="text-[10px] text-neutral-500 mt-0.5">Le reste est déjà engagé dans une demande en attente.</p>
            </div>
          )}
        </div>
      </div>

      {payoutLoadError && (
        <div className="pt-6">
          <p role="alert" className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2 flex items-center justify-between gap-3">
            <span>Impossible de charger vos demandes de retrait.</span>
            <button onClick={loadPayoutData} className="font-semibold underline cursor-pointer shrink-0">Réessayer</button>
          </p>
        </div>
      )}

      {payouts.length > 0 && (
        <div className="py-8 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-bold text-[#111827] mb-4">Demandes de retrait</h2>
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F8F9FA] text-[#6B7280] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Montant</th>
                  <th className="text-left font-semibold px-4 py-3">Moyen</th>
                  <th className="text-left font-semibold px-4 py-3">Numéro</th>
                  <th className="text-center font-semibold px-4 py-3">Statut</th>
                  <th className="text-right font-semibold px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8F9FA]/60">
                    <td className="px-4 py-3 font-mono font-semibold text-[#111827]">{formatCfa(p.amountCfa)}</td>
                    <td className="px-4 py-3 text-[#6B7280]">{PAYOUT_METHOD_LABELS[p.method]}</td>
                    <td className="px-4 py-3 font-mono text-[#6B7280]">{p.phoneNumber}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${PAYOUT_STATUS_STYLES[p.status]}`}>
                        {p.status}
                      </span>
                      {p.status === 'REJETE' && p.adminNote && (
                        <p className="text-[10px] text-[#6B7280] mt-1">{p.adminNote}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#6B7280]">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="pt-8">
        <h2 className="text-lg font-bold text-[#111827] mb-4">Transactions</h2>

        {wallet.entries.length === 0 ? (
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-12 text-center bg-[#F8F9FA]">
            <p className="text-sm font-semibold text-[#111827]">Aucune transaction pour l'instant</p>
            <p className="text-xs text-[#6B7280] mt-1">Les ventes de vos galeries apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F8F9FA] text-[#6B7280] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Type</th>
                  <th className="text-left font-semibold px-4 py-3">Référence</th>
                  <th className="text-right font-semibold px-4 py-3">Montant</th>
                  <th className="text-right font-semibold px-4 py-3">Solde après</th>
                  <th className="text-right font-semibold px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {wallet.entries.map((entry) => {
                  const isCredit = entry.amountCfa >= 0;
                  const Icon = entry.entryType === 'ADJUSTMENT' ? Settings2 : isCredit ? ArrowUpRight : ArrowDownRight;
                  return (
                    <tr key={entry.id} className="hover:bg-[#F8F9FA]/60">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 font-medium text-[#111827]">
                          <Icon className={`w-3.5 h-3.5 ${isCredit ? 'text-emerald-600' : 'text-red-500'}`} />
                          {ENTRY_LABELS[entry.entryType]}
                        </span>
                        {entry.note && <p className="text-[11px] text-[#6B7280] mt-0.5">{entry.note}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#6B7280]">{entry.reference || '—'}</td>
                      <td className={`px-4 py-3 text-right font-mono font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isCredit ? '+' : ''}
                        {formatCfa(entry.amountCfa)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#111827]">{formatCfa(entry.balanceAfterCfa)}</td>
                      <td className="px-4 py-3 text-right text-[#6B7280]">
                        {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PayoutRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableBalanceCfa={availableBalanceCfa ?? 0}
        onRequested={handleRequested}
      />
    </>
  );
};

export const PhotographerWalletPage: React.FC = () => (
  <PhotographerLayout active="wallet">{({ wallet, refetch }) => <WalletContent wallet={wallet} refetch={refetch} />}</PhotographerLayout>
);
