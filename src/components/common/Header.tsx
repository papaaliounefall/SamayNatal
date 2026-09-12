import React from 'react';
import { useApp } from '../../context/AppContext';
import { Camera, Shield, UserCheck, ShoppingBag, Eye, Sparkles } from 'lucide-react';
import { Button } from './Button';

export const Header: React.FC = () => {
  const { role, setRole, navigation, navigateTo, cart, pendingPhotographers } = useApp();

  const isLanding = navigation.view === 'landing';
  const isClientView = navigation.view === 'client_gallery';
  const isAdminView = navigation.view === 'admin_dashboard';
  const isPhotogView =
    navigation.view === 'photographer_dashboard' ||
    navigation.view === 'photographer_event_detail' ||
    navigation.view === 'photographer_wallet';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] select-none">
      {/* Role Switcher bar - Discreet & professional for instant role preview */}
      <div className="bg-[#121212] text-xs text-neutral-300 px-4 py-1.5 flex items-center justify-between flex-wrap gap-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-[#F25C05] animate-pulse" />
            Environnement Démo SaaS :
          </span>
          <span className="font-semibold text-white">
            {role === 'VISITOR' && 'Visiteur Public'}
            {role === 'PHOTOGRAPHE' && 'Espace Photographe (PAF Photography)'}
            {role === 'ADMIN' && 'Super-Admin Plateforme'}
            {role === 'CLIENT' && 'Client Invité (Galerie)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRole('VISITOR')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              role === 'VISITOR'
                ? 'bg-[#F25C05] text-white font-medium'
                : 'hover:bg-neutral-800 text-neutral-300'
            }`}
          >
            Accueil Public
          </button>
          <button
            onClick={() => setRole('PHOTOGRAPHE')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              role === 'PHOTOGRAPHE'
                ? 'bg-[#F25C05] text-white font-medium'
                : 'hover:bg-neutral-800 text-neutral-300'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Photographe Pro
          </button>
          <button
            onClick={() => setRole('ADMIN')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              role === 'ADMIN'
                ? 'bg-[#F25C05] text-white font-medium'
                : 'hover:bg-neutral-800 text-neutral-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
            {pendingPhotographers.length > 0 && (
              <span className="bg-[#EF4444] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingPhotographers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setRole('CLIENT')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer ${
              role === 'CLIENT'
                ? 'bg-[#F25C05] text-white font-medium'
                : 'hover:bg-neutral-800 text-neutral-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Vue Client (Galerie)
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => {
            if (role === 'PHOTOGRAPHE') navigateTo('photographer_dashboard');
            else if (role === 'ADMIN') navigateTo('admin_dashboard');
            else navigateTo('landing');
          }}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-[#121212] flex items-center justify-center text-white shadow-xs border border-neutral-800">
            <Camera className="w-5 h-5 text-[#F25C05]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-[#111827]">
                KIRA
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F25C05] bg-[#FFF1EB] px-1.5 py-0.5 rounded">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-[#6B7280] -mt-0.5 font-medium tracking-wide">
              Plateforme SaaS Photographie
            </p>
          </div>
        </div>

        {/* Navigation context-sensitive */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isLanding && (
            <div className="hidden md:flex items-center gap-6 text-sm text-[#6B7280]">
              <a href="#fonctionnement" className="hover:text-[#111827] transition-colors">
                Fonctionnement
              </a>
              <a href="#photographes" className="hover:text-[#111827] transition-colors">
                Pour les Photographes
              </a>
              <a href="#clients" className="hover:text-[#111827] transition-colors">
                Pour les Clients
              </a>
              <a href="#categories" className="hover:text-[#111827] transition-colors">
                Catégories
              </a>
              <a href="#tarifs" className="hover:text-[#111827] transition-colors">
                Tarifs
              </a>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            {isLanding && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateTo('register_photographer')}
                >
                  Devenir photographe
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setRole('PHOTOGRAPHE')}
                >
                  Espace Pro
                </Button>
              </>
            )}

            {isClientView && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6B7280] hidden sm:inline">
                  Accès Invité Sécurisé
                </span>
                {cart.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#FFF1EB] text-[#F25C05] border border-orange-200 px-3 py-1 rounded-md text-xs font-semibold">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      {cart.length} photo{cart.length > 1 ? 's' : ''} sélectionnée{cart.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}

            {isPhotogView && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B7280]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>PAF Photography • Statut : </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    APPROUVÉ
                  </span>
                </div>
              </div>
            )}

            {isAdminView && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Super-Admin Actif
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
