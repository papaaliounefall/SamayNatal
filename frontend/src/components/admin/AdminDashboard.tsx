import React, { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
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
} from 'lucide-react';
import { AuditLogEntry, PhotographerProfile, PlatformSettingsData } from '../../types/api';
import {
  adminApprovePhotographer,
  adminListPhotographers,
  adminRejectPhotographer,
  adminReinstatePhotographer,
  adminSuspendPhotographer,
} from '../../services/photographers';
import { fetchAuditLogs, fetchPlatformSettings, updateCommissionRate } from '../../services/admin';

type Section = 'photographers' | 'financials' | 'logs';

export const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('photographers');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [photographers, setPhotographers] = useState<PhotographerProfile[]>([]);
  const [settings, setSettings] = useState<PlatformSettingsData | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPhotographers = () => adminListPhotographers({ status: filterStatus }).then((res) => setPhotographers(res.results));

  useEffect(() => {
    setIsLoading(true);
    Promise.all([loadPhotographers(), fetchPlatformSettings().then(setSettings), fetchAuditLogs().then((r) => setLogs(r.results))]).finally(
      () => setIsLoading(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadPhotographers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const handleAction = async (action: (id: string) => Promise<PhotographerProfile>, id: string) => {
    const updated = await action(id);
    setPhotographers((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleCommissionChange = async (rate: number) => {
    const updated = await updateCommissionRate(rate);
    setSettings(updated);
  };

  const pendingCount = photographers.filter((p) => p.status === 'EN_ATTENTE').length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 border-t border-neutral-800 text-xs font-medium">
          {[
            { id: 'photographers' as Section, label: `Photographes (${pendingCount} en attente)`, icon: Users },
            { id: 'financials' as Section, label: 'Commission plateforme', icon: CreditCard },
            { id: 'logs' as Section, label: 'Journal d\'audit', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  activeSection === tab.id ? 'border-[#F25C05] text-white font-semibold' : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
    </div>
  );
};
