import React, { useState } from 'react';
import { Button } from '../common/Button';
import { requestPasswordReset } from '../../services/auth';
import { navigate } from '../../lib/router';
import { Camera, ArrowLeft, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
    } finally {
      // Always show the same confirmation — the backend never reveals
      // whether the email matched an account, so neither do we.
      setIsSubmitting(false);
      setSubmitted(true);
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
            <h1 className="text-lg font-bold text-[#111827]">Mot de passe oublié</h1>
            <p className="text-xs text-[#6B7280]">Recevez un lien de réinitialisation par email</p>
          </div>
        </div>

        {submitted ? (
          <div className="mt-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FFF1EB] text-[#F25C05] flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-sm text-[#111827] font-medium">
              Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé.
            </p>
            <p className="text-xs text-[#6B7280]">Pensez à vérifier vos spams si rien n'arrive.</p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/connexion')}>
              Retour à la connexion
            </Button>
          </div>
        ) : (
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

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
              Envoyer le lien de réinitialisation
            </Button>
          </form>
        )}

        <div className="pt-4 mt-4 border-t border-[#E5E7EB] text-center">
          <button
            onClick={() => navigate('/connexion')}
            className="text-xs text-[#6B7280] hover:text-[#111827] inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};
