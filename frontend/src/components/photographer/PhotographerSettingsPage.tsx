import React, { useState } from 'react';
import { Save, Instagram, Facebook, Globe } from 'lucide-react';
import { Button } from '../common/Button';
import { PhotographerLayout } from './PhotographerLayout';
import { EventCategory, PhotographerProfile } from '../../types/api';
import { updateMyProfile } from '../../services/photographers';
import { ApiError } from '../../lib/api';

const SPECIALTY_LABELS: Record<EventCategory, string> = {
  mariage: 'Mariage',
  sport: 'Sport',
  bapteme: 'Baptême',
  anniversaire: 'Anniversaire',
  evenement_religieux: 'Événement Religieux',
  concert: 'Concert & Spectacle',
  remise_diplome: 'Remise de Diplôme',
  ecole: 'Scolaire & Académique',
  entreprise: 'Entreprise & Gala',
  mode: 'Mode & Shooting',
  shooting_individuel: 'Shooting Individuel',
  evenement_public: 'Événement Public',
  artistique: 'Photographie Artistique',
  autre: 'Autres Événements',
};

const SettingsContent: React.FC<{ profile: PhotographerProfile; refetch: () => void }> = ({ profile, refetch }) => {
  const [form, setForm] = useState({
    businessName: profile.businessName,
    city: profile.city,
    country: profile.country,
    bio: profile.bio,
    portfolioUrl: profile.portfolioUrl,
    specialties: profile.specialties as EventCategory[],
    instagram: profile.socialLinks.instagram || '',
    facebook: profile.socialLinks.facebook || '',
    website: profile.socialLinks.website || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const toggleSpecialty = (cat: EventCategory) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(cat)
        ? prev.specialties.filter((c) => c !== cat)
        : [...prev.specialties, cat],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setIsSaving(true);
    try {
      await updateMyProfile({
        businessName: form.businessName,
        city: form.city,
        country: form.country,
        bio: form.bio,
        portfolioUrl: form.portfolioUrl,
        specialties: form.specialties,
        socialLinks: {
          ...(form.instagram ? { instagram: form.instagram } : {}),
          ...(form.facebook ? { facebook: form.facebook } : {}),
          ...(form.website ? { website: form.website } : {}),
        },
      });
      setSaved(true);
      refetch();
    } catch (err) {
      if (err instanceof ApiError && err.data && typeof err.data === 'object') {
        const messages = Object.values(err.data as Record<string, unknown>).flat().map(String);
        setError(messages[0] || 'Impossible de sauvegarder les modifications.');
      } else {
        setError('Impossible de sauvegarder les modifications.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="pb-8 border-b border-[#E5E7EB]">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">Paramètres</h1>
        <p className="text-xs text-[#6B7280] mt-1">Gérez les informations publiques de votre profil professionnel.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl pt-8 space-y-6">
        <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">Adresse email (non modifiable)</span>
          <span className="font-medium text-[#111827]">{profile.email}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="settings-business-name" className="block text-xs font-semibold text-[#111827] mb-1">Nom professionnel / Studio</label>
            <input
              id="settings-business-name"
              type="text"
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="settings-portfolio" className="block text-xs font-semibold text-[#111827] mb-1">Lien portfolio</label>
            <input
              id="settings-portfolio"
              type="url"
              value={form.portfolioUrl}
              onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="settings-city" className="block text-xs font-semibold text-[#111827] mb-1">Ville</label>
            <input
              id="settings-city"
              type="text"
              required
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="settings-country" className="block text-xs font-semibold text-[#111827] mb-1">Pays</label>
            <input
              id="settings-country"
              type="text"
              required
              autoComplete="country-name"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="settings-bio" className="block text-xs font-semibold text-[#111827] mb-1">Présentation / Expérience</label>
          <textarea
            id="settings-bio"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#111827] mb-2">Spécialités photographiques</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SPECIALTY_LABELS) as EventCategory[]).map((cat) => {
              const isSelected = form.specialties.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleSpecialty(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFF1EB] text-[#F25C05] border-orange-300 font-medium'
                      : 'bg-[#F8F9FA] text-[#6B7280] border-[#E5E7EB] hover:bg-gray-100'
                  }`}
                >
                  {SPECIALTY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E7EB]">
          <label id="settings-social-group" className="block text-xs font-semibold text-[#111827] mb-3 mt-4">Réseaux sociaux</label>
          <div className="space-y-3" role="group" aria-labelledby="settings-social-group">
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-[#6B7280] shrink-0" />
              <input
                type="text"
                aria-label="Instagram"
                placeholder="Instagram (URL ou @nom)"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-[#6B7280] shrink-0" />
              <input
                type="text"
                aria-label="Facebook"
                placeholder="Facebook (URL ou nom de page)"
                value={form.facebook}
                onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#6B7280] shrink-0" />
              <input
                type="text"
                aria-label="Site web"
                placeholder="Site web"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        {saved && !error && (
          <p role="status" className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            Modifications enregistrées.
          </p>
        )}

        <div className="pt-2">
          <Button type="submit" variant="primary" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </>
  );
};

export const PhotographerSettingsPage: React.FC = () => (
  <PhotographerLayout active="settings">{({ profile, refetch }) => <SettingsContent profile={profile} refetch={refetch} />}</PhotographerLayout>
);
