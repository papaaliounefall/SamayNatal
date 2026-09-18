import React, { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ErrorState } from '../common/ErrorState';
import {
  ShieldCheck,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Activity,
  Flag,
  LayoutGrid,
  Camera,
  Wallet as WalletIcon,
  TrendingUp,
  Send,
  RotateCw,
} from 'lucide-react';
import { AdminOrder, AdminPayoutRequest, AdminStats, AuditLogEntry, ModerationActionType, PhotographerProfile, PlatformSettingsData, Report, SystemHealth } from '../../types/api';
import {
  adminApprovePayout,
  adminApprovePhotographer,
  adminListPayouts,
  adminListPhotographers,
  adminRejectPayout,
  adminRejectPhotographer,
  adminReinstatePhotographer,
  adminSuspendPhotographer,
} from '../../services/photographers';
import { adminListOrders, fetchAdminStats, fetchAuditLogs, fetchPlatformSettings, fetchSystemHealth, updateCommissionRate } from '../../services/admin';
import { adminListReports, adminResolveReport } from '../../services/moderation';

type Section = 'overview' | 'photographers' | 'orders' | 'payouts' | 'financials' | 'moderation' | 'logs';

const ORDER_STATUS_LABELS: Record<AdminOrder['paymentStatus'], string> = {
  COMPLETED: 'Payée',
  PENDING: 'En attente',
  FAILED: 'Échouée',
  REFUNDED: 'Remboursée',
};

const PAYOUT_STATUS_LABELS: Record<AdminPayoutRequest['status'], string> = {
  EN_ATTENTE: 'En attente',
  PAYE: 'Payé',
  REJETE: 'Rejeté',
};

const PAYOUT_METHOD_LABELS: Record<AdminPayoutRequest['method'], string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
};

const formatCfa = (amount: number) => `${amount.toLocaleString('fr-FR')} F CFA`;

const HEALTH_CHECK_LABELS: Record<keyof SystemHealth['checks'], string> = {
  database: 'Base de données',
  cache: 'Cache (Redis)',
  storage: 'Stockage (MinIO)',
  celery: 'Tâches (Celery)',
};

interface TabCounts {
  pendingCount: number;
  openReportsCount: number;
  pendingPayoutsCount: number;
}

const TABS: {
  id: Section;
  label: (counts: TabCounts) => string;
  mobileLabel: string;
  icon: React.ElementType;
}[] = [
  { id: 'overview', label: () => "Vue d'ensemble", mobileLabel: 'Vue', icon: LayoutGrid },
  { id: 'photographers', label: ({ pendingCount }) => `Photographes (${pendingCount} en attente)`, mobileLabel: 'Pros', icon: Users },
  { id: 'orders', label: () => 'Commandes', mobileLabel: 'Commandes', icon: CreditCard },
  { id: 'payouts', label: ({ pendingPayoutsCount }) => `Retraits (${pendingPayoutsCount} en attente)`, mobileLabel: 'Retraits', icon: Send },
  { id: 'financials', label: () => 'Commission plateforme', mobileLabel: 'Commission', icon: CreditCard },
  { id: 'moderation', label: ({ openReportsCount }) => `Signalements (${openReportsCount} ouverts)`, mobileLabel: 'Alertes', icon: Flag },
  { id: 'logs', label: () => "Journal d'audit", mobileLabel: 'Journal', icon: Activity },
];

const TARGET_TYPE_LABELS: Record<Report['targetType'], string> = {
  PHOTO: 'Photo',
  EVENT: 'Événement',
  PHOTOGRAPHER: 'Photographe',
};

const REASON_LABELS: Record<Report['reason'], string> = {
  CONTENU_INAPPROPRIE: 'Contenu inapproprié',
  DROITS_AUTEUR: "Atteinte aux droits d'auteur",
  SPAM: 'Spam / arnaque',
  AUTRE: 'Autre',
};

const RESOLUTION_ACTIONS: { id: ModerationActionType; label: string; requiresTargetMatch?: Report['targetType'] }[] = [
  { id: 'SUPPRESSION_PHOTO', label: 'Supprimer la photo', requiresTargetMatch: 'PHOTO' },
  { id: 'SUSPENSION_EVENEMENT', label: "Suspendre l'événement", requiresTargetMatch: 'EVENT' },
  { id: 'SUSPENSION_PHOTOGRAPHE', label: 'Suspendre le photographe', requiresTargetMatch: 'PHOTOGRAPHER' },
  { id: 'AVERTISSEMENT', label: 'Envoyer un avertissement' },
  { id: 'REJET_SIGNALEMENT', label: 'Rejeter le signalement (sans action)' },
];

export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [photographers, setPhotographers] = useState<PhotographerProfile[]>([]);
  const [settings, setSettings] = useState<PlatformSettingsData | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [openReportsCount, setOpenReportsCount] = useState(0);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('OUVERT');
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [resolveActionType, setResolveActionType] = useState<ModerationActionType>('AVERTISSEMENT');
  const [resolveNotes, setResolveNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [payouts, setPayouts] = useState<AdminPayoutRequest[]>([]);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<string>('EN_ATTENTE');
  const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0);
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);

  const loadPhotographers = () => adminListPhotographers({ status: filterStatus }).then((res) => setPhotographers(res.results));
  const loadReports = () => adminListReports({ status: reportStatusFilter }).then((res) => setReports(res.results));
  const loadOpenReportsCount = () => adminListReports({ status: 'OUVERT' }).then((res) => setOpenReportsCount(res.results.length));
  const loadOrders = () => adminListOrders({ paymentStatus: orderStatusFilter, search: orderSearch }).then((res) => setOrders(res.results));
  const loadPayouts = () => adminListPayouts({ status: payoutStatusFilter }).then((res) => setPayouts(res.results));
  const loadPendingPayoutsCount = () => adminListPayouts({ status: 'EN_ATTENTE' }).then((res) => setPendingPayoutsCount(res.results.length));
  // Deliberately not part of loadAll()'s Promise.all — the Celery ping
  // alone can take ~2s, and blocking the whole dashboard's first paint on
  // one diagnostic panel would be a worse "reliable/professional" trade
  // than letting this panel simply pop in a moment later.
  const loadSystemHealth = () => fetchSystemHealth().then(setSystemHealth);

  const handleRefreshHealth = () => {
    setIsRefreshingHealth(true);
    loadSystemHealth().finally(() => setIsRefreshingHealth(false));
  };

  const loadAll = () => {
    setIsLoading(true);
    setLoadError(false);
    Promise.all([
      loadPhotographers(),
      fetchPlatformSettings().then(setSettings),
      fetchAuditLogs().then((r) => setLogs(r.results)),
      loadReports(),
      loadOpenReportsCount(),
      fetchAdminStats().then(setStats),
      loadOrders(),
      loadPayouts(),
      loadPendingPayoutsCount(),
    ])
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAll();
    loadSystemHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPhotographers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportStatusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => loadOrders(), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderStatusFilter, orderSearch]);

  useEffect(() => {
    loadPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payoutStatusFilter]);

  const handleAction = async (action: (id: string) => Promise<PhotographerProfile>, id: string) => {
    const updated = await action(id);
    setPhotographers((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleCommissionChange = async (rate: number) => {
    const updated = await updateCommissionRate(rate);
    setSettings(updated);
  };

  const startResolving = (report: Report) => {
    setResolvingReportId(report.id);
    const defaultAction = RESOLUTION_ACTIONS.find((a) => a.requiresTargetMatch === report.targetType);
    setResolveActionType(defaultAction ? defaultAction.id : 'AVERTISSEMENT');
    setResolveNotes('');
  };

  const confirmResolve = async (reportId: string) => {
    setIsResolving(true);
    try {
      await adminResolveReport(reportId, resolveActionType, resolveNotes);
      setResolvingReportId(null);
      await Promise.all([loadReports(), loadOpenReportsCount()]);
    } finally {
      setIsResolving(false);
    }
  };

  const handleApprovePayout = async (id: string) => {
    setProcessingPayoutId(id);
    try {
      await adminApprovePayout(id);
      await Promise.all([loadPayouts(), loadPendingPayoutsCount()]);
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const handleRejectPayout = async (id: string) => {
    const note = window.prompt('Motif du refus (visible par le photographe) :') || '';
    setProcessingPayoutId(id);
    try {
      await adminRejectPayout(id, note);
      await Promise.all([loadPayouts(), loadPendingPayoutsCount()]);
    } finally {
      setProcessingPayoutId(null);
    }
  };

  const pendingCount = photographers.filter((p) => p.status === 'EN_ATTENTE').length;
  const tabCounts: TabCounts = { pendingCount, openReportsCount, pendingPayoutsCount };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <ErrorState message="Impossible de charger le tableau de bord administrateur." onRetry={loadAll} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#121212] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-[#F25C05]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F25C05] bg-orange-950/60 px-2 py-0.5 rounded border border-orange-500/30">
                SUPER ADMIN
              </span>
              <h1 className="text-xl font-bold text-white mt-0.5">Administration & Gouvernance SaaS</h1>
            </div>
          </div>
          {settings && (
            <span className="text-xs text-neutral-400 font-mono">
              Commission active : <strong className="text-white">{Math.round(settings.commissionRate * 100)}%</strong>
            </span>
          )}
        </div>

        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 items-center gap-2 border-t border-neutral-800 text-xs font-medium overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSection === tab.id ? 'border-[#F25C05] text-white font-semibold' : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label(tabCounts)}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:pb-8 space-y-8">
        {activeSection === 'overview' && stats && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#111827]">Vue d'ensemble de la plateforme</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">Chiffres cumulés, calculés en temps réel à partir des données réelles.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Photographes
                </p>
                <p className="text-2xl font-bold text-[#111827] mt-2">{stats.photographersTotal}</p>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  {stats.photographersApproved} approuvés · {stats.photographersPending} en attente
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Événements
                </p>
                <p className="text-2xl font-bold text-[#111827] mt-2">{stats.eventsTotal}</p>
                <p className="text-[11px] text-[#6B7280] mt-1">{stats.eventsActive} actifs</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Commandes
                </p>
                <p className="text-2xl font-bold text-[#111827] mt-2">{stats.ordersTotal}</p>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  {stats.ordersCompleted} payées · {stats.ordersPending} en attente
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Ventes (30j)
                </p>
                <p className="text-2xl font-bold text-[#111827] mt-2">{stats.ordersLast30Days}</p>
                <p className="text-[11px] text-[#6B7280] mt-1">{formatCfa(stats.revenueLast30DaysCfa)}</p>
              </div>
            </div>

            <div className="bg-[#121212] rounded-2xl p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <WalletIcon className="w-3.5 h-3.5" /> Volume total transigé
                </p>
                <p className="text-2xl font-bold text-white mt-2 font-mono">{formatCfa(stats.totalRevenueCfa)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Commission plateforme cumulée</p>
                <p className="text-2xl font-bold text-[#F25C05] mt-2 font-mono">{formatCfa(stats.totalCommissionCfa)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Reversé aux photographes</p>
                <p className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{formatCfa(stats.totalPhotographerEarningsCfa)}</p>
              </div>
            </div>

            {systemHealth && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">État du système</h3>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {systemHealth.healthy ? 'Tous les services fonctionnent normalement.' : 'Au moins un service ne répond pas.'}
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshHealth}
                    disabled={isRefreshingHealth}
                    aria-label="Actualiser l'état du système"
                    className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F8F9FA] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`w-4 h-4 ${isRefreshingHealth ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {(Object.keys(systemHealth.checks) as (keyof SystemHealth['checks'])[]).map((key) => {
                    const check = systemHealth.checks[key];
                    const isUp = check.status === 'up';
                    return (
                      <div key={key} className={`p-3 rounded-lg border text-xs ${isUp ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="font-semibold text-[#111827]">{HEALTH_CHECK_LABELS[key]}</span>
                        </div>
                        <p className={`mt-1 font-mono text-[10px] ${isUp ? 'text-emerald-700' : 'text-red-600'}`}>
                          {isUp ? `Opérationnel · ${check.latencyMs} ms` : check.error || 'Indisponible'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'orders' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#111827]">Commandes de la plateforme</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Toutes les commandes, tous photographes confondus.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  aria-label="Rechercher une commande par numéro, client ou email"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Rechercher (n°, client, email)"
                  className="text-xs px-3 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none w-56"
                />
                <div className="flex items-center gap-1.5 text-xs">
                  {['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        orderStatusFilter === st ? 'bg-[#111827] text-white font-semibold' : 'bg-[#F8F9FA] text-[#6B7280] hover:bg-gray-200'
                      }`}
                    >
                      {st === 'ALL' ? 'Toutes' : ORDER_STATUS_LABELS[st as AdminOrder['paymentStatus']]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#6B7280] border-b border-[#E5E7EB] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">N° Commande</th>
                    <th className="px-5 py-3">Photographe</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-right">Commission</th>
                    <th className="px-5 py-3 text-center">Statut</th>
                    <th className="px-5 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono text-[#111827]">{order.orderNumber}</td>
                      <td className="px-5 py-4 text-[#111827]">{order.photographerBusinessName}</td>
                      <td className="px-5 py-4">
                        <p className="text-[#111827] font-medium">{order.clientName}</p>
                        <p className="text-[11px] text-[#6B7280]">{order.clientEmail}</p>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-[#111827]">{formatCfa(order.totalAmountCfa)}</td>
                      <td className="px-5 py-4 text-right font-mono text-[#F25C05]">{formatCfa(order.platformCommissionCfa)}</td>
                      <td className="px-5 py-4 text-center">
                        <Badge variant={order.paymentStatus === 'COMPLETED' ? 'success' : order.paymentStatus === 'PENDING' ? 'warning' : 'danger'} size="sm">
                          {ORDER_STATUS_LABELS[order.paymentStatus]}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right text-[#6B7280]">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-[#6B7280]">Aucune commande ne correspond à ces critères.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'payouts' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#111827]">Demandes de retrait</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Il n'y a pas de passerelle de paiement automatique — approuver une demande signifie que vous avez
                  déjà envoyé l'argent vous-même via Wave/Orange Money/Free Money.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {['ALL', 'EN_ATTENTE', 'PAYE', 'REJETE'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setPayoutStatusFilter(st)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      payoutStatusFilter === st ? 'bg-[#111827] text-white font-semibold' : 'bg-[#F8F9FA] text-[#6B7280] hover:bg-gray-200'
                    }`}
                  >
                    {st === 'ALL' ? 'Toutes' : PAYOUT_STATUS_LABELS[st as AdminPayoutRequest['status']]}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#6B7280] border-b border-[#E5E7EB] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Photographe</th>
                    <th className="px-5 py-3 text-right">Montant</th>
                    <th className="px-5 py-3">Moyen</th>
                    <th className="px-5 py-3">Numéro</th>
                    <th className="px-5 py-3 text-center">Statut</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4 font-medium text-[#111827]">{p.photographerBusinessName}</td>
                      <td className="px-5 py-4 text-right font-mono font-semibold text-[#111827]">{formatCfa(p.amountCfa)}</td>
                      <td className="px-5 py-4 text-[#6B7280]">{PAYOUT_METHOD_LABELS[p.method]}</td>
                      <td className="px-5 py-4 font-mono text-[#6B7280]">{p.phoneNumber}</td>
                      <td className="px-5 py-4 text-center">
                        <Badge variant={p.status === 'PAYE' ? 'success' : p.status === 'REJETE' ? 'danger' : 'warning'} size="sm">
                          {PAYOUT_STATUS_LABELS[p.status]}
                        </Badge>
                        {p.status !== 'EN_ATTENTE' && p.processedByLabel && (
                          <p className="text-[10px] text-[#6B7280] mt-1">par {p.processedByLabel}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#6B7280]">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-4 text-right">
                        {p.status === 'EN_ATTENTE' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="primary" size="sm"
                              isLoading={processingPayoutId === p.id}
                              onClick={() => handleApprovePayout(p.id)}
                              icon={<CheckCircle className="w-3.5 h-3.5" />}
                            >
                              Marquer payé
                            </Button>
                            <Button
                              variant="secondary" size="sm"
                              disabled={processingPayoutId === p.id}
                              onClick={() => handleRejectPayout(p.id)}
                              icon={<XCircle className="w-3.5 h-3.5" />}
                            >
                              Refuser
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[#6B7280]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-[#6B7280]">Aucune demande de retrait dans cette catégorie.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'photographers' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#111827]">Approbation & Gestion des Photographes</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Tout photographe inscrit doit être validé avant d'accéder aux fonctionnalités professionnelles.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {['ALL', 'EN_ATTENTE', 'APPROUVÉ', 'SUSPENDU', 'REFUSÉ'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      filterStatus === st ? 'bg-[#111827] text-white font-semibold' : 'bg-[#F8F9FA] text-[#6B7280] hover:bg-gray-200'
                    }`}
                  >
                    {st === 'ALL' ? 'Tous' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#6B7280] border-b border-[#E5E7EB] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Photographe</th>
                    <th className="px-5 py-3">Localisation</th>
                    <th className="px-5 py-3">Spécialités</th>
                    <th className="px-5 py-3">Formule</th>
                    <th className="px-5 py-3">Statut actuel</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {photographers.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-[#111827]">{p.businessName}</p>
                          <p className="text-[11px] text-[#6B7280]">{p.email}</p>
                          {p.portfolioUrl && (
                            <a href={p.portfolioUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#F25C05] hover:underline inline-flex items-center gap-0.5 mt-0.5">
                              Portfolio <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#6B7280]">{p.city}, {p.country}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.specialties.map((s) => (
                            <span key={s} className="text-[10px] bg-gray-100 text-[#4B5563] px-1.5 py-0.5 rounded capitalize">
                              {s.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-[11px] font-bold text-[#111827]">{p.subscriptionPlan}</span>
                        <p className="text-[10px] text-[#6B7280]">
                          {(p.storageUsedMb / 1024).toFixed(1)} / {(p.storageMaxMb / 1024).toFixed(0)} Go
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={p.status === 'APPROUVÉ' ? 'success' : p.status === 'SUSPENDU' || p.status === 'REFUSÉ' ? 'danger' : 'warning'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {p.status === 'EN_ATTENTE' && (
                            <>
                              <Button variant="primary" size="sm" onClick={() => handleAction((id) => adminApprovePhotographer(id), p.id)} icon={<CheckCircle className="w-3.5 h-3.5" />}>
                                Approuver
                              </Button>
                              <Button variant="secondary" size="sm" onClick={() => handleAction((id) => adminRejectPhotographer(id), p.id)} icon={<XCircle className="w-3.5 h-3.5" />}>
                                Refuser
                              </Button>
                            </>
                          )}
                          {p.status === 'APPROUVÉ' && (
                            <Button variant="secondary" size="sm" onClick={() => handleAction((id) => adminSuspendPhotographer(id), p.id)} icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}>
                              Suspendre
                            </Button>
                          )}
                          {(p.status === 'SUSPENDU' || p.status === 'REFUSÉ') && (
                            <Button variant="primary" size="sm" onClick={() => handleAction((id) => adminReinstatePhotographer(id), p.id)}>
                              Réactiver
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {photographers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-[#6B7280]">Aucun photographe dans cette catégorie.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'financials' && settings && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
            <h2 className="text-base font-bold text-[#111827]">Taux de Commission Plateforme</h2>
            <p className="text-xs text-[#6B7280] mt-1">
              S'applique à chaque nouvelle commande. Les commandes déjà passées ne sont pas affectées.
            </p>

            <div className="mt-6 max-w-md space-y-3">
              <div className="flex justify-between text-xs font-semibold text-[#111827]">
                <span>Taux de commission plateforme</span>
                <span className="font-mono text-base text-[#F25C05]">{Math.round(settings.commissionRate * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.3"
                step="0.01"
                aria-label="Taux de commission plateforme"
                aria-valuetext={`${Math.round(settings.commissionRate * 100)}%`}
                value={settings.commissionRate}
                onChange={(e) => handleCommissionChange(parseFloat(e.target.value))}
                className="w-full accent-[#F25C05] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#6B7280]">
                <span>0%</span>
                <span>15%</span>
                <span>30%</span>
              </div>
              <p className="text-[10px] text-[#6B7280] pt-2">
                Dernière modification : {new Date(settings.updatedAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        )}

        {activeSection === 'moderation' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#111827]">Signalements & Modération</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Contenus et profils signalés par des clients ou des visiteurs, en attente de traitement.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {['ALL', 'OUVERT', 'EN_COURS', 'RESOLU', 'REJETE'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setReportStatusFilter(st)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      reportStatusFilter === st ? 'bg-[#111827] text-white font-semibold' : 'bg-[#F8F9FA] text-[#6B7280] hover:bg-gray-200'
                    }`}
                  >
                    {st === 'ALL' ? 'Tous' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#E5E7EB]">
              {reports.map((report) => (
                <div key={report.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="neutral" size="sm">
                          {TARGET_TYPE_LABELS[report.targetType]}
                        </Badge>
                        <Badge variant={report.status === 'OUVERT' ? 'danger' : report.status === 'EN_COURS' ? 'warning' : 'success'} size="sm">
                          {report.status}
                        </Badge>
                        <span className="text-xs font-semibold text-[#111827]">{REASON_LABELS[report.reason]}</span>
                      </div>
                      {report.targetLabel && <p className="text-xs text-[#111827] mt-1.5 font-medium">{report.targetLabel}</p>}
                      {report.details && <p className="text-xs text-[#6B7280] mt-1">{report.details}</p>}
                      <p className="text-[11px] text-neutral-400 font-mono mt-1.5">
                        {report.reporterEmail || 'Signalement anonyme'} · {new Date(report.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>

                    {(report.status === 'OUVERT' || report.status === 'EN_COURS') && resolvingReportId !== report.id && (
                      <Button variant="secondary" size="sm" onClick={() => startResolving(report)} icon={<Flag className="w-3.5 h-3.5" />}>
                        Traiter
                      </Button>
                    )}
                  </div>

                  {resolvingReportId === report.id && (
                    <div className="mt-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#111827] mb-1.5">Action à appliquer</label>
                        <div className="flex flex-wrap gap-2">
                          {RESOLUTION_ACTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              aria-pressed={resolveActionType === opt.id}
                              onClick={() => setResolveActionType(opt.id)}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                                resolveActionType === opt.id
                                  ? 'bg-[#111827] text-white border-[#111827] font-medium'
                                  : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-gray-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor={`resolve-notes-${report.id}`} className="block text-xs font-semibold text-[#111827] mb-1.5">Note interne (optionnelle)</label>
                        <textarea
                          id={`resolve-notes-${report.id}`}
                          rows={2}
                          value={resolveNotes}
                          onChange={(e) => setResolveNotes(e.target.value)}
                          placeholder="Motif de la décision, pour l'historique de modération..."
                          className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="primary" size="sm" isLoading={isResolving} onClick={() => confirmResolve(report.id)}>
                          Confirmer l'action
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setResolvingReportId(null)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {reports.length === 0 && (
                <div className="px-5 py-8 text-center text-[#6B7280] text-xs">Aucun signalement dans cette catégorie.</div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'logs' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827]">Journal d'audit</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">Historique réel des actions sensibles enregistrées par la plateforme.</p>
            </div>
            <div className="divide-y divide-[#E5E7EB] max-h-[32rem] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="px-5 py-3 text-xs flex items-start gap-3">
                  <Calendar className="w-3.5 h-3.5 text-[#6B7280] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111827]">
                      {log.action} <span className="font-normal text-[#6B7280]">— {log.actorLabel}</span>
                    </p>
                    {log.targetLabel && <p className="text-[11px] text-[#6B7280] truncate">{log.targetLabel}</p>}
                    {log.details && <p className="text-[11px] text-[#6B7280]">{log.details}</p>}
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <div className="px-5 py-8 text-center text-[#6B7280] text-xs">Aucune activité enregistrée.</div>}
            </div>
          </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#121212] border-t border-neutral-800 flex items-stretch pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          const showDot =
            (tab.id === 'photographers' && pendingCount > 0) ||
            (tab.id === 'moderation' && openReportsCount > 0) ||
            (tab.id === 'payouts' && pendingPayoutsCount > 0);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 cursor-pointer transition-colors ${
                isActive ? 'text-[#F25C05]' : 'text-neutral-400'
              }`}
            >
              <span className="relative">
                <Icon className="w-5 h-5" />
                {showDot && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#F25C05]" />}
              </span>
              <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
