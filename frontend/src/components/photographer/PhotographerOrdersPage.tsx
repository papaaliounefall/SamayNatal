import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { PhotographerLayout } from './PhotographerLayout';
import { ErrorState } from '../common/ErrorState';
import { Order, PaymentStatus } from '../../types/api';
import { fetchMyOrders } from '../../services/orders';

const STATUS_STYLES: Record<PaymentStatus, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-red-50 text-red-600 border-red-200',
  REFUNDED: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  COMPLETED: 'Payée',
  PENDING: 'En attente',
  FAILED: 'Échouée',
  REFUNDED: 'Remboursée',
};

const PAYMENT_METHOD_LABELS: Record<Order['paymentMethod'], string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
  CARTE_BANCAIRE: 'Carte bancaire',
};

const formatCfa = (amount: number) => `${amount.toLocaleString('fr-FR')} F CFA`;

const OrdersContent: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');

  const loadOrders = () => {
    setIsLoading(true);
    setLoadError(false);
    fetchMyOrders()
      .then((res) => setOrders(res.results))
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = statusFilter === 'ALL' ? orders : orders.filter((o) => o.paymentStatus === statusFilter);
  const totalEarnings = orders
    .filter((o) => o.paymentStatus === 'COMPLETED')
    .reduce((sum, o) => sum + o.photographerEarningsCfa, 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">Ventes</h1>
          <p className="text-xs text-[#6B7280] mt-1">Toutes les commandes passées sur vos événements.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-8 border-b border-[#E5E7EB]">
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Commandes</p>
          <p className="text-2xl font-bold text-[#111827] mt-1">{orders.length}</p>
        </div>
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Payées</p>
          <p className="text-2xl font-bold text-[#111827] mt-1">
            {orders.filter((o) => o.paymentStatus === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB] col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Gains cumulés</p>
          <p className="text-2xl font-bold text-[#F25C05] mt-1 font-mono">{formatCfa(totalEarnings)}</p>
        </div>
      </div>

      <div className="pt-8">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {(['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer font-medium ${
                statusFilter === s
                  ? 'bg-[#121212] text-white border-[#121212]'
                  : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F8F9FA]'
              }`}
            >
              {s === 'ALL' ? 'Toutes' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          <ErrorState message="Impossible de charger vos commandes." onRetry={loadOrders} />
        ) : filtered.length === 0 ? (
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-12 text-center bg-[#F8F9FA]">
            <CreditCard className="w-6 h-6 text-[#6B7280] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">Aucune commande</p>
            <p className="text-xs text-[#6B7280] mt-1">Les achats de vos clients apparaîtront ici en temps réel.</p>
          </div>
        ) : (
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F8F9FA] text-[#6B7280] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">N° Commande</th>
                  <th className="text-left font-semibold px-4 py-3">Événement</th>
                  <th className="text-left font-semibold px-4 py-3">Client</th>
                  <th className="text-left font-semibold px-4 py-3">Moyen</th>
                  <th className="text-right font-semibold px-4 py-3">Total</th>
                  <th className="text-right font-semibold px-4 py-3">Vos gains</th>
                  <th className="text-center font-semibold px-4 py-3">Statut</th>
                  <th className="text-right font-semibold px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F8F9FA]/60">
                    <td className="px-4 py-3 font-mono text-[#111827]">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-[#111827] max-w-[180px] truncate">{order.eventTitle}</td>
                    <td className="px-4 py-3">
                      <p className="text-[#111827] font-medium">{order.clientName}</p>
                      <p className="text-[11px] text-[#6B7280]">{order.clientEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280]">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#111827]">{formatCfa(order.totalAmountCfa)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                      {formatCfa(order.photographerEarningsCfa)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.paymentStatus]}`}
                      >
                        {STATUS_LABELS[order.paymentStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#6B7280]">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export const PhotographerOrdersPage: React.FC = () => (
  <PhotographerLayout active="orders">{() => <OrdersContent />}</PhotographerLayout>
);
