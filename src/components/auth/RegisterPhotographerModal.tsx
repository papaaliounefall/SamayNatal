import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Camera, CheckCircle2, Clock, ShieldCheck, ArrowLeft, AlertCircle } from 'lucide-react';
import { EventCategory } from '../../types';

export const RegisterPhotographerModal: React.FC = () => {
  const { registerPhotographer, navigateTo, setRole } = useApp();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    city: 'Dakar',
    country: 'Sénégal',
    bio: '',
    portfolioUrl: '',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    subscriptionPlan: 'PRO' as 'FREE' | 'PRO' | 'STUDIO',
    acceptedTerms: false,
  });

  const [selectedSpecialties, setSelectedSpecialties] = useState<EventCategory[]>([
    'mariage',
    'sport',
  ]);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const availableSpecialties: { id: EventCategory; label: string }[] = [
    { id: 'mariage', label: 'Mariage' },
    { id: 'sport', label: 'Sport' },
    { id: 'bapteme', label: 'Baptême' },
    { id: 'anniversaire', label: 'Anniversaire' },
    { id: 'evenement_religieux', label: 'Événement Religieux' },
    { id: 'concert', label: 'Concert & Spectacle' },
    { id: 'remise_diplome', label: 'Remise de Diplôme' },
    { id: 'ecole', label: 'Scolaire & Académique' },
    { id: 'entreprise', label: 'Entreprise & Gala' },
    { id: 'mode', label: 'Mode & Shooting' },
    { id: 'shooting_individuel', label: 'Shooting Individuel' },
    { id: 'evenement_public', label: 'Événement Public' },
    { id: 'artistique', label: 'Photographie Artistique' },
    { id: 'autre', label: 'Autres Événements' },
  ];

  const toggleSpecialty = (cat: EventCategory) => {
    if (selectedSpecialties.includes(cat)) {
      setSelectedSpecialties(selectedSpecialties.filter((c) => c !== cat));
    } else {
      setSelectedSpecialties([...selectedSpecialties, cat]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      alert('Veuillez accepter les conditions générales de la plateforme.');
      return;
    }

    registerPhotographer({
      firstName: formData.firstName || 'Mamadou',
      lastName: formData.lastName || 'Sow',
      businessName: formData.businessName || 'Sow Visual Arts',
      email: formData.email || 'mamadou.sow@photo.sn',
      phone: formData.phone || '+221 77 123 45 67',
      city: formData.city,
      country: formData.country,
      bio: formData.bio || 'Photographe passionné avec couverture complète d’événements au Sénégal.',
      specialties: selectedSpecialties,
      portfolioUrl: formData.portfolioUrl || 'https://instagram.com/sowvisuals',
      avatarUrl: formData.avatarUrl,
      subscriptionPlan: formData.subscriptionPlan,
    });

    setSubmittedSuccess(true);
  };

  if (submittedSuccess) {
    return (
      <div className="min-h-[85vh] bg-[#F8F9FA] flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-2xl p-8 border border-[#E5E7EB] shadow-md text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 text-[#F59E0B] flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F59E0B] bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Statut : EN_ATTENTE
            </span>
            <h2 className="text-2xl font-bold text-[#111827] mt-3">
              Candidature transmise à l’administrateur
            </h2>
            <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
              Votre profil photographe professionnel a été enregistré avec succès. Conformément à la politique qualité de la plateforme, notre équipe examine votre portfolio avant activation.
            </p>
          </div>

          <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E5E7EB] text-left text-xs space-y-2 text-[#6B7280]">
            <p className="font-semibold text-[#111827]">Prochaines étapes :</p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              Vérification des informations et du lien de portfolio
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              Attribution du statut <strong>APPROUVÉ</strong> par l’administrateur
            </p>
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" />
              Déblocage des uploads haute résolution et des galeries QR Code
            </p>
          </div>

          {/* Quick simulator shortcut for reviewer */}
          <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
            <p className="text-[11px] text-[#6B7280]">
              Mode Démo : Vous pouvez valider cette candidature directement depuis le tableau de bord Admin.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setRole('ADMIN');
                  navigateTo('admin_dashboard');
                }}
              >
                Ouvrir l'Espace Admin pour Valider
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigateTo('landing')}
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigateTo('landing')}
          className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#111827] mb-6 cursor-pointer font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </button>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 sm:p-10">
          <div className="flex items-center gap-3 pb-6 border-b border-[#E5E7EB]">
            <div className="w-10 h-10 rounded-xl bg-[#121212] flex items-center justify-center text-white">
              <Camera className="w-5 h-5 text-[#F25C05]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827]">
                Inscription Photographe Professionnel
              </h1>
              <p className="text-xs text-[#6B7280]">
                Créez votre profil pour commencer à héberger et monétiser vos galeries.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Papa Alioune"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Nom de famille *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Fall"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
                />
              </div>
            </div>

            {/* Business & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Nom professionnel / Nom de Studio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: PAF Photography"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Téléphone (WhatsApp pro) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+221 77 000 00 00"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Adresse Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@studio.sn"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Mot de passe *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Ville *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  Pays *
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
                />
              </div>
            </div>

            {/* Portfolio & Bio */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Lien Portfolio ou Réseau Professionnel (Instagram / Site web) *
              </label>
              <input
                type="url"
                required
                placeholder="https://instagram.com/mon_studio_photo"
                value={formData.portfolioUrl}
                onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
              />
              <p className="text-[11px] text-[#6B7280] mt-1">
                Ce lien sera examiné par l’administrateur pour valider votre statut professionnel.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                Présentation / Expérience
              </label>
              <textarea
                rows={3}
                placeholder="Décrivez brièvement vos prestations et le matériel utilisé (boîtiers, objectifs)..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-md focus:border-[#F25C05] focus:outline-none"
              />
            </div>

            {/* Specialties checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-2">
                Spécialités Photographiques (sélectionnez vos domaines)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSpecialties.map((cat) => {
                  const isSelected = selectedSpecialties.includes(cat.id);
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => toggleSpecialty(cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFF1EB] text-[#F25C05] border-orange-300 font-medium'
                          : 'bg-[#F8F9FA] text-[#6B7280] border-[#E5E7EB] hover:bg-gray-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan selection */}
            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-2">
                Formule souhaitée (Facturation après validation)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'FREE', label: 'Free', price: '0 F / mois', storage: '5 Go' },
                  { id: 'PRO', label: 'Pro Studio', price: '15 000 F', storage: '100 Go' },
                  { id: 'STUDIO', label: 'Agence', price: '35 000 F', storage: '500 Go' },
                ].map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setFormData({ ...formData, subscriptionPlan: plan.id as any })}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      formData.subscriptionPlan === plan.id
                        ? 'border-[#F25C05] bg-[#FFF1EB]/50 ring-1 ring-[#F25C05]'
                        : 'border-[#E5E7EB] bg-[#F8F9FA] hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#111827]">{plan.label}</p>
                    <p className="text-xs text-[#F25C05] font-semibold mt-0.5">{plan.price}</p>
                    <p className="text-[10px] text-[#6B7280]">{plan.storage}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-3 border-t border-[#E5E7EB]">
              <label className="flex items-start gap-2 text-xs text-[#6B7280] cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.acceptedTerms}
                  onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                  className="mt-0.5 rounded border-gray-300 text-[#F25C05] focus:ring-[#F25C05]"
                />
                <span>
                  J’atteste être photographe indépendant ou représentant d’un studio et j’accepte les{' '}
                  <span className="text-[#111827] underline">Conditions Générales d’Utilisation</span>. Je comprends que mon profil sera soumis au statut <strong>EN_ATTENTE</strong> pour audit avant publication.
                </span>
              </label>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Soumettre ma candidature photographe
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
