import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../common/Button';
import {
  Camera,
  QrCode,
  ShieldCheck,
  Download,
  Share2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Check,
  ExternalLink,
  Users,
  Eye,
  Sliders,
  DollarSign,
  CloudLightning,
} from 'lucide-react';
import { EventCategory } from '../../types';

export const LandingPage: React.FC = () => {
  const { setRole, navigateTo, events } = useApp();
  const [selectedDemoCat, setSelectedDemoCat] = useState<string>('all');

  const categoriesList: { id: EventCategory | 'all'; label: string; count: number; image: string }[] = [
    {
      id: 'all',
      label: 'Tous les événements',
      count: 48,
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'mariage',
      label: 'Mariage & Réceptions',
      count: 18,
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'sport',
      label: 'Sport & Tournois',
      count: 12,
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'remise_diplome',
      label: 'Remise de diplômes & Écoles',
      count: 9,
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'entreprise',
      label: 'Entreprise & Conférences',
      count: 14,
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'mode',
      label: 'Mode & Défilés',
      count: 7,
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const demoPhotos = [
    {
      title: 'Mariage Fatou & Abdou — Dakar',
      cat: 'Mariage',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85',
      photog: 'PAF Photography',
      eventId: 'evt-fatou-abdou',
    },
    {
      title: 'Tournoi National de Basketball',
      cat: 'Sport',
      url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=85',
      photog: 'PAF Photography',
      eventId: 'evt-tournoi-basket',
    },
    {
      title: 'Promotion Mandela — UNIPRO',
      cat: 'Éducation',
      url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=85',
      photog: 'PAF Photography',
      eventId: 'evt-unipro-2026',
    },
    {
      title: 'Dakar Tech Innovation Summit',
      cat: 'Entreprise',
      url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=900&q=85',
      photog: 'PAF Photography',
      eventId: 'evt-tech-summit',
    },
    {
      title: 'Défilé Semaine de la Mode Dakar',
      cat: 'Mode',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85',
      photog: 'Lumière Noire Studio',
      eventId: 'evt-fatou-abdou',
    },
    {
      title: 'Portraits intimistes coucher de soleil',
      cat: 'Portrait',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=85',
      photog: 'Teranga Moments',
      eventId: 'evt-fatou-abdou',
    },
  ];

  return (
    <div className="bg-white min-h-screen text-[#111827]">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF1EB] border border-orange-200 text-xs font-semibold text-[#F25C05]">
                <Camera className="w-3.5 h-3.5" />
                <span>La référence SaaS pour photographes événementiels</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111827] leading-[1.12]">
                Vos photos. <br />
                Vos clients. <br />
                <span className="text-[#F25C05]">Un seul espace.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#6B7280] max-w-xl font-normal leading-relaxed">
                Une plateforme professionnelle pour organiser, partager et valoriser vos photos, de l’événement jusqu’au client. Fini les envois compressés sur WhatsApp et les souvenirs perdus.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigateTo('register_photographer')}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Devenir photographe
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setRole('CLIENT');
                    navigateTo('client_gallery', { eventId: events[0]?.id || 'evt-fatou-abdou' });
                  }}
                  icon={<Eye className="w-4 h-4" />}
                >
                  Explorer une galerie démo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-[#E5E7EB] grid grid-cols-3 gap-4 text-xs text-[#6B7280]">
                <div>
                  <p className="font-bold text-[#111827] text-base">Originaux HD</p>
                  <p className="mt-0.5">Stockage S3 privé & sécurisé</p>
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-base">QR Code 1-Click</p>
                  <p className="mt-0.5">Accès direct sur événement</p>
                </div>
                <div>
                  <p className="font-bold text-[#111827] text-base">Monétisation</p>
                  <p className="mt-0.5">Wave, Orange Money & CB</p>
                </div>
              </div>
            </div>

            {/* Right Visual: Authentic Photographic Composition */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#E5E7EB] bg-[#121212]">
                <img
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85"
                  alt="Composition photographique professionnelle"
                  className="w-full h-[460px] object-cover"
                />

                {/* Floating Mockup Badge: Event QR Code */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-[#E5E7EB] flex items-center gap-3 max-w-xs">
                  <div className="w-10 h-10 rounded-lg bg-[#121212] flex items-center justify-center text-white shrink-0">
                    <QrCode className="w-5 h-5 text-[#F25C05]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#111827]">Mariage Fatou & Abdou</p>
                    <p className="text-[10px] text-[#6B7280]">Scannez pour voir les 428 photos</p>
                  </div>
                </div>

                {/* Floating Bottom Card: Photographer Proof */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#121212]/90 backdrop-blur-md rounded-xl p-4 text-white border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                      alt="Photographe Pro"
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">PAF Photography • Dakar</p>
                      <p className="text-[11px] text-neutral-400">4 événements récents • 1 840 photos livrées</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#F25C05] bg-[#FFF1EB]/10 border border-orange-500/30 px-2.5 py-1 rounded">
                    Studio Certifié
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMMENT ÇA FONCTIONNE (4 ÉTAPES CLAIRES) */}
      <section id="fonctionnement" className="py-20 bg-[#F8F9FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">
              Flux d'expérience sans friction
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2">
              Comment ça fonctionne
            </h2>
            <p className="text-[#6B7280] text-sm sm:text-base mt-2">
              Du déclenchement de l'appareil à la livraison des souvenirs haute définition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs relative">
              <span className="text-xs font-mono font-bold text-[#F25C05] bg-[#FFF1EB] px-2 py-0.5 rounded">
                Étape 01
              </span>
              <h3 className="text-lg font-bold text-[#111827] mt-4 mb-2">Créez votre événement</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Renseignez le nom, la date, le lieu et définissez vos sous-galeries (Cérémonie, Officiels, Portraits).
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs relative">
              <span className="text-xs font-mono font-bold text-[#F25C05] bg-[#FFF1EB] px-2 py-0.5 rounded">
                Étape 02
              </span>
              <h3 className="text-lg font-bold text-[#111827] mt-4 mb-2">Importez vos photos</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Glissez-déposez des centaines de clichés. Les miniatures légères et previews filigranées sont générées automatiquement.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs relative">
              <span className="text-xs font-mono font-bold text-[#F25C05] bg-[#FFF1EB] px-2 py-0.5 rounded">
                Étape 03
              </span>
              <h3 className="text-lg font-bold text-[#111827] mt-4 mb-2">Partagez votre galerie</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Imprimez le QR code pour la salle, projetez-le sur écran ou envoyez le lien sécurisé direct par WhatsApp.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs relative">
              <span className="text-xs font-mono font-bold text-[#F25C05] bg-[#FFF1EB] px-2 py-0.5 rounded">
                Étape 04
              </span>
              <h3 className="text-lg font-bold text-[#111827] mt-4 mb-2">Vos clients profitent</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Les invités consultent dans une galerie ultra-fluide, sélectionnent leurs photos préférées et commandent en HD sans perte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POUR LES PHOTOGRAPHES & POUR LES CLIENTS (DUAL SECTIONS) */}
      <section id="photographes" className="py-20 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">
                Espace Professionnel
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2 mb-4">
                Pensé pour le quotidien des photographes
              </h2>
              <p className="text-[#6B7280] text-sm mb-8 leading-relaxed">
                Gagnez des heures après chaque prestation. Fini la gestion manuelle sur WhatsApp, les requêtes individuelles interminables et la compression destructrice.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: 'Gestion multi-galeries par événement',
                    desc: 'Organisez vos événements en sous-dossiers chronologiques (Cérémonie, Invités, Soirée).',
                  },
                  {
                    title: 'Watermark automatique & protection des fichiers originaux',
                    desc: 'Vos fichiers HD restent isolés dans un stockage privé S3. Vos aperçus sont protégés par votre filigrane.',
                  },
                  {
                    title: 'QR Code instantané pour événements',
                    desc: 'Affichez ou imprimez un QR code dès le début de l’événement pour capter l’audience en direct.',
                  },
                  {
                    title: 'Vente directe & solde sécurisé',
                    desc: 'Fixez vos tarifs à l’unité ou en pack. Recevez vos gains directement via Wave, Orange Money ou CB.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#FFF1EB] text-[#F25C05] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#111827]">{item.title}</h4>
                      <p className="text-xs text-[#6B7280] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button
                  variant="primary"
                  onClick={() => navigateTo('register_photographer')}
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Postuler comme photographe
                </Button>
              </div>
            </div>

            {/* Photographer Dashboard Preview mockup */}
            <div className="bg-[#121212] p-6 rounded-2xl border border-neutral-800 shadow-xl text-white">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                  dashboard.kira.pro/events
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                    <p className="text-[10px] text-neutral-400 uppercase">Événements</p>
                    <p className="text-xl font-bold text-white mt-1">12</p>
                  </div>
                  <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                    <p className="text-[10px] text-neutral-400 uppercase">Photos en ligne</p>
                    <p className="text-xl font-bold text-white mt-1">1 840</p>
                  </div>
                  <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                    <p className="text-[10px] text-neutral-400 uppercase">Gains cumulés</p>
                    <p className="text-xl font-bold text-[#F25C05] mt-1">285 000 F</p>
                  </div>
                </div>

                <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-white">Mariage Fatou & Abdou</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                      ACTIF • CODE PIN
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <img
                      src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=200&q=70"
                      alt=""
                      className="rounded h-16 w-full object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=200&q=70"
                      alt=""
                      className="rounded h-16 w-full object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=70"
                      alt=""
                      className="rounded h-16 w-full object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=200&q=70"
                      alt=""
                      className="rounded h-16 w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. POUR LES CLIENTS */}
      <section id="clients" className="py-20 bg-[#F8F9FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Mockup: Client mobile-like view */}
            <div className="order-2 lg:order-1 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-md max-w-md mx-auto w-full">
              <div className="text-center pb-4 border-b border-[#E5E7EB]">
                <span className="text-[11px] font-semibold text-[#F25C05] bg-[#FFF1EB] px-2.5 py-0.5 rounded-full uppercase">
                  Galerie Invité
                </span>
                <h3 className="text-base font-bold text-[#111827] mt-2">Mariage Fatou & Abdou</h3>
                <p className="text-xs text-[#6B7280]">📸 24 photos haute résolution</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="relative rounded-lg overflow-hidden border border-[#E5E7EB]">
                  <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80"
                    alt=""
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                    #101
                  </div>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-[#E5E7EB]">
                  <img
                    src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80"
                    alt=""
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                    #102
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">Téléchargement HD disponible</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setRole('CLIENT');
                    navigateTo('client_gallery', { eventId: 'evt-fatou-abdou' });
                  }}
                >
                  Ouvrir la galerie
                </Button>
              </div>
            </div>

            {/* Right: Copy */}
            <div className="order-1 lg:order-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">
                Expérience Invité & Client
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2 mb-4">
                Retrouvez vos souvenirs en toute simplicité
              </h2>
              <p className="text-[#6B7280] text-sm mb-6 leading-relaxed">
                Plus besoin d’attendre ou d’insister auprès des mariés ou organisateurs. Scannez le QR code ou entrez le lien de l’événement pour accéder instantanément à vos photos.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: 'Accès sans création de compte obligatoire',
                    desc: 'Consultez la galerie directement depuis votre téléphone en scannant le QR code de la soirée.',
                  },
                  {
                    title: 'Qualité native sans compression WhatsApp',
                    desc: 'Vos photos sont restituées dans leur piqué d’origine, parfaites pour tirages ou partages sociaux.',
                  },
                  {
                    title: 'Sélection & commande en quelques clics',
                    desc: 'Sélectionnez vos portraits favoris et payez simplement avec Wave ou Orange Money.',
                  },
                  {
                    title: 'Conservation garantie dans le temps',
                    desc: 'Accédez à votre espace souvenir plusieurs mois après l’événement sans risquer de perdre les fichiers.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#FFF1EB] text-[#F25C05] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#111827]">{item.title}</h4>
                      <p className="text-xs text-[#6B7280] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TOUTES LES CATÉGORIES */}
      <section id="categories" className="py-20 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">
              Universalité
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2">
              Conçu pour toutes les catégories de photographie
            </h2>
            <p className="text-[#6B7280] text-sm mt-2">
              Chaque événement a ses spécificités : de la cérémonie intime au tournoi de stade.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoriesList.slice(1).map((cat) => (
              <div
                key={cat.id}
                className="group relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-neutral-900 cursor-pointer h-48 flex flex-col justify-end p-4 transition-transform hover:-translate-y-1 duration-200"
                onClick={() => {
                  setRole('CLIENT');
                  navigateTo('client_gallery', { eventId: events[0]?.id });
                }}
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10">
                  <p className="text-xs font-bold text-white leading-snug">{cat.label}</p>
                  <p className="text-[10px] text-neutral-300 mt-0.5">{cat.count} galeries actives</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. GALERIE DÉMO EN GRANDES PHOTOS */}
      <section className="py-20 bg-[#F8F9FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">
                Démonstrateur Réel
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2">
                Galerie de démonstration interactive
              </h2>
              <p className="text-[#6B7280] text-sm mt-1">
                La photographie reste au centre de l'expérience, pure et sans artifice.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRole('CLIENT');
                navigateTo('client_gallery', { eventId: 'evt-fatou-abdou' });
              }}
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              iconPosition="right"
            >
              Tester l'expérience client complète
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoPhotos.map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setRole('CLIENT');
                  navigateTo('client_gallery', { eventId: item.eventId });
                }}
                className="group bg-white rounded-xl overflow-hidden border border-[#E5E7EB] shadow-xs cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-neutral-100">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded">
                    {item.cat}
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-[#111827] text-xs font-semibold px-3 py-1.5 rounded-md shadow-md">
                      Voir la galerie
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-[#111827] truncate">{item.title}</h4>
                  <p className="text-xs text-[#6B7280] mt-1">{item.photog}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SÉCURITÉ & ARCHITECTURE TECHNIQUE */}
      <section className="py-20 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">
              Sécurité & Architecture
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2">
              Vos originaux protégés à chaque étape
            </h2>
            <p className="text-[#6B7280] text-sm mt-2">
              Conçu pour respecter les droits d'auteur des photographes et la vie privée des clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F8F9FA] p-6 rounded-xl border border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#F25C05] mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-2">Galeries Privées & Codes PIN</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Protégez les événements familiaux ou corporatifs par mot de passe ou code PIN à 4 chiffres. Seules les personnes autorisées peuvent y accéder.
              </p>
            </div>

            <div className="bg-[#F8F9FA] p-6 rounded-xl border border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#F25C05] mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-2">URLs Signées & Stockage S3</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Les fichiers originaux RAW / JPEG ne sont jamais exposés publiquement. Les téléchargements sont validés via URLs signées à expiration automatique.
              </p>
            </div>

            <div className="bg-[#F8F9FA] p-6 rounded-xl border border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#F25C05] mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-2">Filigrane Intelligent</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Appliquez un filigrane automatique (texte ou logo, opacité réglable) sur les previews publiques. La version HD propre n’est débloquée qu’après paiement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TARIFS */}
      <section id="tarifs" className="py-20 bg-[#F8F9FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">
              Tarification Transparente
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2">
              Des forfaits adaptés à votre activité
            </h2>
            <p className="text-[#6B7280] text-sm mt-2">
              Commencez gratuitement et faites évoluer votre stockage selon le volume de vos événements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Free */}
            <div className="bg-white p-8 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Découverte</span>
                <h3 className="text-2xl font-bold text-[#111827] mt-2">Free</h3>
                <p className="text-3xl font-extrabold text-[#111827] mt-4 mb-2">0 FCFA</p>
                <p className="text-xs text-[#6B7280] mb-6">Pour tester la plateforme sur vos premiers événements</p>

                <ul className="space-y-3 text-xs text-[#111827]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Jusqu'à 3 événements actifs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> 5 Go de stockage sécurisé
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Génération de QR Code
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Commission vente photos : 15%
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigateTo('register_photographer')}
                >
                  Choisir Free
                </Button>
              </div>
            </div>

            {/* Pro - Highlighted */}
            <div className="bg-[#121212] text-white p-8 rounded-xl border-2 border-[#F25C05] shadow-xl flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F25C05] text-white text-[11px] font-bold uppercase px-3 py-0.5 rounded-full">
                Le plus populaire
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#F25C05]">Professionnel</span>
                <h3 className="text-2xl font-bold text-white mt-2">Pro Studio</h3>
                <p className="text-3xl font-extrabold text-white mt-4 mb-2">
                  15 000 <span className="text-sm font-normal text-neutral-400">FCFA / mois</span>
                </p>
                <p className="text-xs text-neutral-400 mb-6">Pour les photographes réguliers de mariages et tournois</p>

                <ul className="space-y-3 text-xs text-neutral-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#F25C05]" /> Événements illimités
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#F25C05]" /> 100 Go de stockage cloud
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#F25C05]" /> Filigrane personnalisé (texte & logo)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#F25C05]" /> Mode écran & impression QR
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#F25C05]" /> Commission réduite : 8%
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigateTo('register_photographer')}
                >
                  Démarrer avec Pro
                </Button>
              </div>
            </div>

            {/* Studio */}
            <div className="bg-white p-8 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Agence</span>
                <h3 className="text-2xl font-bold text-[#111827] mt-2">Agence & Collectif</h3>
                <p className="text-3xl font-extrabold text-[#111827] mt-4 mb-2">
                  35 000 <span className="text-sm font-normal text-[#6B7280]">FCFA / mois</span>
                </p>
                <p className="text-xs text-[#6B7280] mb-6">Pour les équipes multi-cadreurs et agences de presse</p>

                <ul className="space-y-3 text-xs text-[#111827]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Multi-utilisateurs & collaborateurs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> 500 Go de stockage dédié
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Domaine personnalisé
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Commission minimale : 5%
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" /> Support prioritaire WhatsApp
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigateTo('register_photographer')}
                >
                  Contacter le support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. CTA FINAL */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">
            Commencez à organiser vos photos autrement.
          </h2>
          <p className="text-base text-[#6B7280] mt-3 max-w-xl mx-auto">
            Rejoignez les photographes qui valorisent leur travail et simplifient la vie de leurs clients.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigateTo('register_photographer')}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Créer mon espace photographe
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setRole('PHOTOGRAPHE')}
            >
              Voir la démo en direct
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#121212] text-neutral-400 text-xs py-12 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#F25C05]" />
              <span className="font-bold text-white text-sm">KIRA SaaS Photographie</span>
              <span className="text-[10px] text-neutral-500">• Dakar, Sénégal</span>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setRole('ADMIN')}
                className="hover:text-white transition-colors cursor-pointer text-[11px]"
              >
                Accès Administration
              </button>
              <button
                onClick={() => navigateTo('register_photographer')}
                className="hover:text-white transition-colors cursor-pointer text-[11px]"
              >
                Devenir Partenaire
              </button>
              <span className="text-neutral-600">© 2026 Tous droits réservés</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
