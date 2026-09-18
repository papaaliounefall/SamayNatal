import React, { useState } from 'react';
import { Button } from '../common/Button';
import { confirmPasswordReset } from '../../services/auth';
import { ApiError } from '../../lib/api';
import { navigate } from '../../lib/router';
import { Camera, CheckCircle2 } from 'lucide-react';

interface ResetPasswordPageProps {
  uid: string;
  token: string;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ uid, token }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(uid, token, password);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.data && typeof err.data === 'object') {
        const messages = Object.values(err.data as Record<string, unknown>).flat().map(String);
        setError(messages[0] || 'Ce lien de réinitialisation est invalide ou a expiré.');
      } else {
        setError('Ce lien de réinitialisation est invalide ou a expiré.');
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
            <h1 className="text-lg font-bold text-[#111827]">Nouveau mot de passe</h1>
            <p className="text-xs text-[#6B7280]">Choisissez un mot de passe pour votre compte</p>
          </div>
        </div>

        {success ? (
          <div className="mt-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-[#111827] font-medium">Mot de passe réinitialisé avec succès.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/connexion')}>
              Se connecter
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label htmlFor="reset-password" className="block text-xs font-semibold text-[#111827] mb-1">Nouveau mot de passe</label>
              <input
                id="reset-password"
                type="password"
                required
                minLength={10}
                autoFocus
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">10 caractères minimum.</p>
            </div>

            <div>
              <label htmlFor="reset-password-confirm" className="block text-xs font-semibold text-[#111827] mb-1">Confirmer le mot de passe</label>
              <input
                id="reset-password-confirm"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
              Réinitialiser le mot de passe
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
