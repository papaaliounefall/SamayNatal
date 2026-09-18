import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Camera, Shield, ShoppingBag, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from './Button';
import { NotificationBell } from './NotificationBell';
import { navigate, useLocation } from '../../lib/router';

const LANDING_NAV_LINKS = [
  { href: '#fonctionnement', label: 'Fonctionnement' },
  { href: '#photographes', label: 'Pour les Photographes' },
  { href: '#clients', label: 'Pour les Clients' },
  { href: '#categories', label: 'Catégories' },
  { href: '#tarifs', label: 'Tarifs' },
];

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const path = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isLanding = path === '/';
  const isClientView = /^\/g\//.test(path);
  const isAdminView = path === '/admin';
  const isPhotogView = path.startsWith('/dashboard');

  const homeHref = user?.role === 'PHOTOGRAPHE' ? '/dashboard' : user?.role === 'ADMIN' ? '/admin' : '/';

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => navigate(homeHref)}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-[#121212] flex items-center justify-center text-white shadow-xs border border-neutral-800">
            <Camera className="w-5 h-5 text-[#F25C05]" />
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#111827] whitespace-nowrap">
                SAMAY NATAL
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-[#6B7280] -mt-0.5 font-medium tracking-wide whitespace-nowrap">
              Plateforme SaaS Photographie
            </p>
          </div>
        </button>

        <div className="flex items-center gap-3 sm:gap-4">
          {isLanding && (
            <div className="hidden md:flex items-center gap-6 text-sm text-[#6B7280]">
              {LANDING_NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="hover:text-[#111827] transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {isLanding && (
            <button
              onClick={() => setMobileNavOpen((v) => !v)}
              className="md:hidden p-2 -mr-1 rounded-lg text-[#6B7280] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
              aria-label={mobileNavOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="flex items-center gap-2.5">
            {isClientView && cart.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#FFF1EB] text-[#F25C05] border border-orange-200 px-3 py-1 rounded-md text-xs font-semibold">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  {cart.length} photo{cart.length > 1 ? 's' : ''} sélectionnée{cart.length > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {isAdminView && (
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Super-Admin
              </span>
            )}

            {isPhotogView && user?.photographerStatus && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B7280]">
                <span className={`w-2 h-2 rounded-full ${user.photographerStatus === 'APPROUVÉ' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>Statut : </span>
                <span className="font-semibold text-[#111827]">{user.photographerStatus}</span>
              </div>
            )}

            {!user && isLanding && (
              <>
                <div className="hidden md:block">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/inscription-photographe')}>
                    Devenir photographe
                  </Button>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate('/connexion')}>
                  Connexion
                </Button>
              </>
            )}

            {!user && !isLanding && !isClientView && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/connexion')}>
                Connexion
              </Button>
            )}

            {user && (user.role === 'PHOTOGRAPHE' || user.role === 'ADMIN') && <NotificationBell />}

            {user && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#111827] hover:bg-[#F8F9FA] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="hidden sm:inline">{user.firstName || user.email}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-20 py-1 text-xs">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#111827] hover:bg-[#F8F9FA] cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Déconnexion
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLanding && mobileNavOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-4 py-3 space-y-0.5">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileNavOpen(false)}
              className="block px-2 py-2.5 rounded-lg text-sm text-[#111827] hover:bg-[#F8F9FA] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 mt-2 border-t border-[#E5E7EB]">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setMobileNavOpen(false);
                navigate('/inscription-photographe');
              }}
            >
              Devenir photographe
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
