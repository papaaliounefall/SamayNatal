import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Camera, Shield, ShoppingBag, LogOut, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { navigate, useLocation } from '../../lib/router';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const path = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

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
              <a href="#fonctionnement" className="hover:text-[#111827] transition-colors">Fonctionnement</a>
              <a href="#photographes" className="hover:text-[#111827] transition-colors">Pour les Photographes</a>
              <a href="#clients" className="hover:text-[#111827] transition-colors">Pour les Clients</a>
              <a href="#categories" className="hover:text-[#111827] transition-colors">Catégories</a>
              <a href="#tarifs" className="hover:text-[#111827] transition-colors">Tarifs</a>
            </div>
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
                <Button variant="ghost" size="sm" onClick={() => navigate('/inscription-photographe')}>
                  Devenir photographe
                </Button>
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
    </header>
  );
};
