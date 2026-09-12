import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  ShieldCheck,
  Users,
  HardDrive,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Activity,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { PhotographerStatus } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    allPhotographers,
    photographers: ctxPhotographers,
    events = [],
    photos = [],
    orders = [],
    platformCommissionRate = 0.15,
    setPlatformCommissionRate,
    updatePhotographerStatus,
    navigateTo,
  } = useApp();

  const photographers = ctxPhotographers || allPhotographers || [];

  const [activeSection, setActiveSection] = useState<'photographers' | 'events' | 'financials' | 'logs'>('photographers');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Compute stats
  const pendingPhotographers = (photographers || []).filter((p) => p.status === 'EN_ATTENTE');
  const approvedPhotographers = (photographers || []).filter((p) => p.status === 'APPROUVÉ');
  const totalStorageMB = (photographers || []).reduce((sum, p) => sum + (p.storageUsedMB || 0), 0);
  const totalStorageGB = (totalStorageMB / 1024).toFixed(2);

  const totalGrossSales = (orders || []).reduce((sum, o) => sum + (o.totalAmountCFA || 0), 0);
  const totalPlatformCommissions = (orders || []).reduce(
    (sum, o) => sum + (o.platformCommissionCFA || (o as any).platformFeeCFA || 0),
    0
  );

  const displayedPhotographers = (photographers || []).filter((p) => {
    if (filterStatus === 'ALL') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Top Admin Banner */}
      <div className="bg-[#121212] text-white border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-[#F25C05]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F25C05] bg-orange-950/60 px-2 py-0.5 rounded border border-orange-500/30">
                  SUPER ADMIN
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  Console Centrale de Supervision
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mt-0.5">
                Administration & Gouvernance SaaS
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400 font-mono">
              Commission active : <strong className="text-white">{Math.round(platformCommissionRate * 100)}%</strong>
            </span>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 border-t border-neutral-800 text-xs font-medium">
          {[
            { id: 'photographers', label: `Photographes (${pendingPhotographers.length} en attente)`, icon: Users },
            { id: 'events', label: `Événements & Galeries (${events.length})`, icon: Calendar },
            { id: 'financials', label: 'Ventes & Revenus Plateforme', icon: CreditCard },
            { id: 'logs', label: 'Audit & Infrastructure S3', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  activeSection === tab.id
                    ? 'border-[#F25C05] text-white font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Admin Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Photographes en attente
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#F59E0B]">
                {pendingPhotographers.length}
              </span>
              <span className="text-xs text-[#6B7280]">sur {photographers.length} au total</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Stockage S3 Utilisé
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#111827]">
                {totalStorageGB} Go
              </span>
              <span className="text-xs text-[#6B7280]">MinIO / R2</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Volume d'affaires (GMV)
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#111827]">
                {totalGrossSales.toLocaleString('fr-FR')} F
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
              Commissions Plateforme
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-[#F25C05]">
                {totalPlatformCommissions.toLocaleString('fr-FR')} F
              </span>
              <span className="text-xs text-[#6B7280]">net SaaS</span>
            </div>
          </div>
        </div>

        {/* Section: Photographers Management & Status Review */}
        {activeSection === 'photographers' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#111827]">
                  Approbation & Gestion des Photographes
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Conformément au workflow qualité, tout photographe inscrit doit être validé avant d'accéder aux fonctionnalités complètes.
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1.5 text-xs">
                {['ALL', 'EN_ATTENTE', 'APPROUVÉ', 'SUSPENDU', 'REFUSÉ'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      filterStatus === st
                        ? 'bg-[#111827] text-white font-semibold'
                        : 'bg-[#F8F9FA] text-[#6B7280] hover:bg-gray-200'
                    }`}
                  >
                    {st === 'ALL' ? 'Tous' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Photographers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#6B7280] border-b border-[#E5E7EB] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Photographe</th>
                    <th className="px-5 py-3">Localisation</th>
                    <th className="px-5 py-3">Spécialités</th>
                    <th className="px-5 py-3">Formule</th>
                    <th className="px-5 py-3">Statut actuel</th>
                    <th className="px-5 py-3 text-right">Actions d'audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {displayedPhotographers.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatarUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-[#E5E7EB]"
                          />
                          <div>
                            <p className="font-bold text-[#111827]">{p.businessName}</p>
                            <p className="text-[11px] text-[#6B7280]">
                              {p.firstName} {p.lastName} • {p.email}
                            </p>
                            {p.portfolioUrl && (
                              <a
                                href={p.portfolioUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-[#F25C05] hover:underline inline-flex items-center gap-0.5 mt-0.5"
                              >
                                Portfolio / Instagram <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[#6B7280]">
                        {p.city}, {p.country}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.specialties.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] bg-gray-100 text-[#4B5563] px-1.5 py-0.5 rounded capitalize"
                            >
                              {s.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-[11px] font-bold text-[#111827]">
                          {p.subscriptionPlan}
                        </span>
                        <p className="text-[10px] text-[#6B7280]">
                          {(p.storageUsedMB / 1024).toFixed(1)} / {(p.storageMaxMB / 1024).toFixed(0)} Go
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <Badge status={p.status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {p.status === 'EN_ATTENTE' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => updatePhotographerStatus(p.id, 'APPROUVÉ')}
                                icon={<CheckCircle className="w-3.5 h-3.5" />}
                              >
                                Approuver
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => updatePhotographerStatus(p.id, 'REFUSÉ')}
                                icon={<XCircle className="w-3.5 h-3.5" />}
                              >
                                Refuser
                              </Button>
                            </>
                          )}

                          {p.status === 'APPROUVÉ' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => updatePhotographerStatus(p.id, 'SUSPENDU')}
                              icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                            >
                              Suspendre
                            </Button>
                          )}

                          {p.status === 'SUSPENDU' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => updatePhotographerStatus(p.id, 'APPROUVÉ')}
                            >
                              Réactiver
                            </Button>
                          )}

                          {p.status === 'REFUSÉ' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => updatePhotographerStatus(p.id, 'APPROUVÉ')}
                            >
                              Réexaminer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section: Events Overview */}
        {activeSection === 'events' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base font-bold text-[#111827]">Événements hébergés</h2>
                <p className="text-xs text-[#6B7280]">
                  Surveillance des galeries publiques, protégées et de l'activité.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-xl border border-[#E5E7EB] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={evt.coverPhotoUrl}
                      alt=""
                      className="w-16 h-12 rounded object-cover border border-[#E5E7EB] shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-bold text-[#111827] truncate">{evt.title}</p>
                      <p className="text-[11px] text-[#6B7280]">
                        Par {evt.photographerName} • {evt.date}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#6B7280] font-mono">
                        <span>📸 {evt.photosCount} photos</span>
                        <span>👁️ {evt.viewsCount} vues</span>
                        <span>⬇️ {evt.downloadsCount} dl</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigateTo('client_gallery', { eventId: evt.id })}
                    >
                      Voir galerie
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section: Financials & Commission Settings */}
        {activeSection === 'financials' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
              <h2 className="text-base font-bold text-[#111827]">Paramétrage du Taux de Commission</h2>
              <p className="text-xs text-[#6B7280] mt-1">
                Ajustez le prélèvement SaaS appliqué aux ventes de photos des photographes.
              </p>

              <div className="mt-6 max-w-md space-y-3">
                <div className="flex justify-between text-xs font-semibold text-[#111827]">
                  <span>Taux de commission plateforme</span>
                  <span className="font-mono text-base text-[#F25C05]">
                    {Math.round(platformCommissionRate * 100)} %
                  </span>
                </div>

                <input
                  type="range"
                  min="0.05"
                  max="0.30"
                  step="0.01"
                  value={platformCommissionRate}
                  onChange={(e) => setPlatformCommissionRate(parseFloat(e.target.value))}
                  className="w-full accent-[#F25C05] cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-[#6B7280]">
                  <span>5% (Ultra-compétitif)</span>
                  <span>15% (Recommandé)</span>
                  <span>30% (Standard international)</span>
                </div>
              </div>
            </div>

            {/* Orders list */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#E5E7EB]">
                <h3 className="text-sm font-bold text-[#111827]">Transactions récentes</h3>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] text-[#6B7280] border-b border-[#E5E7EB] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Commande</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Méthode</th>
                    <th className="px-5 py-3">Total payé</th>
                    <th className="px-5 py-3">Commission SaaS</th>
                    <th className="px-5 py-3">Net Photographe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] font-mono">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-semibold text-[#111827]">{o.orderNumber}</td>
                      <td className="px-5 py-3 font-sans">{o.clientName}</td>
                      <td className="px-5 py-3 font-sans">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px]">
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold">{o.totalAmountCFA.toLocaleString('fr-FR')} F</td>
                      <td className="px-5 py-3 text-[#F25C05]">
                        +{(o.platformCommissionCFA || (o as any).platformFeeCFA || 0).toLocaleString('fr-FR')} F
                      </td>
                      <td className="px-5 py-3 text-emerald-700">
                        {o.photographerEarningsCFA.toLocaleString('fr-FR')} F
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section: Logs & Infrastructure */}
        {activeSection === 'logs' && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-[#111827]">
              Journal d'Audit & Santé Infrastructure
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#111827]">Serveur de stockage MinIO</p>
                <p className="text-[11px] text-emerald-600 font-mono mt-0.5">● Opérationnel (100%)</p>
                <p className="text-[10px] text-[#6B7280] mt-1">Bucket : saas-photos-vault-prod</p>
              </div>

              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#111827]">Worker Celery / Redis</p>
                <p className="text-[11px] text-emerald-600 font-mono mt-0.5">● 4 Workers actifs</p>
                <p className="text-[10px] text-[#6B7280] mt-1">Pipeline resizing & watermark</p>
              </div>

              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB]">
                <p className="text-xs font-semibold text-[#111827]">Passerelles Mobile Money</p>
                <p className="text-[11px] text-emerald-600 font-mono mt-0.5">● Wave, OM, Free actifs</p>
                <p className="text-[10px] text-[#6B7280] mt-1">Webhook latency &lt; 180ms</p>
              </div>
            </div>

            <div className="bg-[#121212] rounded-xl p-4 text-neutral-300 font-mono text-[11px] space-y-1.5 max-h-60 overflow-y-auto">
              <p className="text-neutral-500">// Logs d'activité récents :</p>
              <p>[AUTH] Photographer mamadou.sow@photo.sn registered with status EN_ATTENTE</p>
              <p>[S3_PIPELINE] Batch upload 4 photos completed for event evt-01 in 1.4s</p>
              <p>[CELERY] Generated 4 thumbnails + watermark overlays</p>
              <p>[PAYMENT_WEBHOOK] Wave mobile money transaction completed 2 000 FCFA</p>
              <p>[SIGNED_URL] Temporary download token generated for photo #101 (expires 7d)</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
