import React, { useEffect, useState } from 'react';
import { Users, Mail, Phone, Search } from 'lucide-react';
import { PhotographerLayout } from './PhotographerLayout';
import { ErrorState } from '../common/ErrorState';
import { ClientSummary } from '../../types/api';
import { fetchMyClients } from '../../services/orders';

const formatCfa = (amount: number) => `${amount.toLocaleString('fr-FR')} F CFA`;

const ClientsContent: React.FC = () => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');

  const loadClients = () => {
    setIsLoading(true);
    setLoadError(false);
    fetchMyClients()
      .then(setClients)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filtered = clients.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return c.clientName.toLowerCase().includes(term) || c.clientEmail.toLowerCase().includes(term);
  });

  const totalClients = clients.length;
  const totalSpent = clients.reduce((sum, c) => sum + c.totalSpentCfa, 0);
  const repeatClients = clients.filter((c) => c.completedOrdersCount > 1).length;

  return (
    <>
      <div className="pb-8 border-b border-[#E5E7EB]">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">Clients</h1>
        <p className="text-xs text-[#6B7280] mt-1">Toutes les personnes ayant commandé des photos sur vos événements.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-8 border-b border-[#E5E7EB]">
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Clients</p>
          <p className="text-2xl font-bold text-[#111827] mt-1">{totalClients}</p>
        </div>
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Clients fidèles</p>
          <p className="text-2xl font-bold text-[#111827] mt-1">{repeatClients}</p>
        </div>
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB] col-span-2 sm:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Total dépensé</p>
          <p className="text-2xl font-bold text-[#F25C05] mt-1 font-mono">{formatCfa(totalSpent)}</p>
        </div>
      </div>

      <div className="pt-8">
        <div className="relative mb-4 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Rechercher un client"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          <ErrorState message="Impossible de charger vos clients." onRetry={loadClients} />
        ) : filtered.length === 0 ? (
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-12 text-center bg-[#F8F9FA]">
            <Users className="w-6 h-6 text-[#6B7280] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">
              {clients.length === 0 ? 'Aucun client pour l\'instant' : 'Aucun résultat'}
            </p>
            <p className="text-xs text-[#6B7280] mt-1">
              {clients.length === 0
                ? 'Vos clients apparaîtront ici dès leur première commande.'
                : 'Essayez un autre nom ou une autre adresse email.'}
            </p>
          </div>
        ) : (
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F8F9FA] text-[#6B7280] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Client</th>
                  <th className="text-left font-semibold px-4 py-3">Contact</th>
                  <th className="text-right font-semibold px-4 py-3">Commandes</th>
                  <th className="text-right font-semibold px-4 py-3">Total dépensé</th>
                  <th className="text-right font-semibold px-4 py-3">Dernier achat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.map((c) => (
                  <tr key={c.clientEmail} className="hover:bg-[#F8F9FA]/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#111827]">{c.clientName}</p>
                      {c.completedOrdersCount > 1 && (
                        <span className="text-[10px] font-semibold text-[#F25C05] bg-[#FFF1EB] px-1.5 py-0.5 rounded-full">
                          Client fidèle
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1.5 text-[#6B7280]">
                        <Mail className="w-3 h-3" /> {c.clientEmail}
                      </p>
                      {c.clientPhone && (
                        <p className="flex items-center gap-1.5 text-[#6B7280] mt-0.5">
                          <Phone className="w-3 h-3" /> {c.clientPhone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#111827]">
                      {c.completedOrdersCount}
                      {c.ordersCount !== c.completedOrdersCount && (
                        <span className="text-[#6B7280]"> / {c.ordersCount}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">{formatCfa(c.totalSpentCfa)}</td>
                    <td className="px-4 py-3 text-right text-[#6B7280]">
                      {new Date(c.lastPurchaseAt).toLocaleDateString('fr-FR')}
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

export const PhotographerClientsPage: React.FC = () => (
  <PhotographerLayout active="clients">{() => <ClientsContent />}</PhotographerLayout>
);
