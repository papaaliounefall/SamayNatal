import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { ApiError } from '../../lib/api';
import { navigate } from '../../lib/router';
import { Camera, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    navigate(user.role === 'ADMIN' ? '/admin' : user.role === 'PHOTOGRAPHE' ? '/dashboard' : '/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(loggedInUser.role === 'ADMIN' ? '/admin' : loggedInUser.role === 'PHOTOGRAPHE' ? '/dashboard' : '/');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 423) {
          setError('Compte temporairement verrouillé suite à trop de tentatives échouées. Réessayez plus tard.');
        } else {
          setError(err.detail || 'Email ou mot de passe incorrect.');
        }
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl border border-[#E5E7EB] shadow-xs p-8">
        <div className="flex items-center gap-3 pb-6 border-b border-[#E5E7EB]">
          <div className="w-10 h-10 rounded-xl bg-[#121212] flex items-center justify-center text-white">
            <Camera className="w-5 h-5 text-[#F25C05]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#111827]">Connexion</h1>
            <p className="text-xs text-[#6B7280]">Espace photographe ou administration</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Adresse email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111827] mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="text-right -mt-2">
            <button
              type="button"
              onClick={() => navigate('/mot-de-passe-oublie')}
              className="text-xs text-[#6B7280] hover:text-[#F25C05] cursor-pointer"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            icon={<LogIn className="w-4 h-4" />}
          >
            Se connecter
          </Button>
        </form>

        <div className="pt-4 mt-4 border-t border-[#E5E7EB] text-center">
          <p className="text-xs text-[#6B7280]">
            Pas encore de compte photographe ?{' '}
            <button
              onClick={() => navigate('/inscription-photographe')}
              className="text-[#F25C05] font-semibold hover:underline cursor-pointer"
            >
              Créer un profil professionnel
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
