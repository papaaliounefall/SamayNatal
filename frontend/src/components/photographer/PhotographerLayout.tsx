import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  Wallet as WalletIcon,
  Settings,
  LogOut,
  HardDrive,
  Users,
} from 'lucide-react';
import { PhotographerProfile, Wallet } from '../../types/api';
import { fetchMyProfile, fetchMyWallet } from '../../services/photographers';
import { navigate } from '../../lib/router';
import { ErrorState } from '../common/ErrorState';

export type PhotographerTab = 'dashboard' | 'orders' | 'clients' | 'wallet' | 'settings';

interface LayoutContext {
  profile: PhotographerProfile;
  wallet: Wallet;
  refetch: () => void;
}

interface PhotographerLayoutProps {
  active: PhotographerTab;
  children: (ctx: LayoutContext) => React.ReactNode;
}

const NAV_ITEMS: { id: PhotographerTab; label: string; mobileLabel: string; icon: React.ElementType; path: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord', mobileLabel: 'Accueil', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'orders', label: 'Ventes', mobileLabel: 'Ventes', icon: CreditCard, path: '/dashboard/commandes' },
  { id: 'clients', label: 'Clients', mobileLabel: 'Clients', icon: Users, path: '/dashboard/clients' },
  { id: 'wallet', label: 'Portefeuille', mobileLabel: 'Solde', icon: WalletIcon, path: '/dashboard/portefeuille' },
  { id: 'settings', label: 'Paramètres', mobileLabel: 'Réglages', icon: Settings, path: '/dashboard/parametres' },
];

export const PhotographerLayout: React.FC<PhotographerLayoutProps> = ({ active, children }) => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<PhotographerProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    return Promise.all([fetchMyProfile(), fetchMyWallet()])
      .then(([p, w]) => {
        setProfile(p);
        setWallet(w);
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Only the initial load blocks rendering — a refetch() (e.g. after saving
  // settings) must not unmount the page's own content/local state, so it
  // updates profile/wallet silently once data is already in hand.
  if (!profile || !wallet) {
    if (loadError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-sm w-full">
            <ErrorState message="Impossible de charger votre espace photographe." onRetry={load} />
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const storageUsedPercent = profile.storageMaxMb ? Math.round((profile.storageUsedMb / profile.storageMaxMb) * 100) : 0;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-[#121212] text-neutral-300 flex flex-col justify-between shrink-0 border-r border-neutral-800 select-none">
        <div>
          <div className="p-6 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 font-bold text-sm shrink-0">
                {profile.businessName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{profile.businessName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${profile.status === 'APPROUVÉ' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400">{profile.status}</span>
                </div>
              </div>
              {/* Nav + logout move to a fixed bottom tab bar below `md` — the
                  logout action still needs a home up here on mobile. */}
              <button
                onClick={handleLogout}
                className="md:hidden shrink-0 p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80">
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> Stockage
                </span>
                <span className="font-mono text-white">
                  {(profile.storageUsedMb / 1024).toFixed(1)} / {(profile.storageMaxMb / 1024).toFixed(0)} Go
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#F25C05] h-full transition-all" style={{ width: `${storageUsedPercent}%` }} />
              </div>
            </div>
          </div>

          <nav className="hidden md:block p-4 space-y-1 text-xs font-medium">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === active;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left ${
                    isActive ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F25C05]' : ''}`} />
                    {item.label}
                  </div>
                  {item.id === 'wallet' && (
                    <span className="text-[#F25C05] font-mono font-bold text-[11px]">
                      {wallet.balanceCfa.toLocaleString('fr-FR')} F
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:block p-4 border-t border-neutral-800 space-y-1 text-xs">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 px-6 pt-6 pb-24 sm:px-8 sm:pt-8 md:pb-6 lg:px-10 lg:pt-10 lg:pb-10 max-w-7xl">
        {children({ profile, wallet, refetch: load })}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#121212] border-t border-neutral-800 flex items-stretch pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 cursor-pointer transition-colors ${
                isActive ? 'text-[#F25C05]' : 'text-neutral-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
