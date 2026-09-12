import React, { useEffect, useState } from 'react';
import { Button } from '../common/Button';
import { Camera, ShieldCheck, Lock, Sliders, ArrowRight, Check } from 'lucide-react';
import { navigate } from '../../lib/router';
import { fetchSubscriptionPlans } from '../../services/subscriptions';
import { SubscriptionPlan } from '../../types/api';
import { HeroPhotoBackground } from './HeroPhotoBackground';
import { PhotoCollage, CollageCard } from './PhotoCollage';

import weddingImg from '../../assets/photos/marie.jpg';
import weddingImg2 from '../../assets/photos/mariage.jpg';
import sportImg from '../../assets/photos/foott.jpg';
import sportActionImg from '../../assets/photos/IMG_9401.jpg';
import schoolImg from '../../assets/photos/etude.jpg';
import fashionImg from '../../assets/photos/shoot.jpg';
import portraitImg from '../../assets/photos/im.jpg';
import photographerAvatar from '../../assets/photos/foot.jpg';
import cameraHandsImg from '../../assets/photos/pho.jpg';

const heroBackgroundSlides = [
  { src: cameraHandsImg, alt: '', position: 'center' },
  { src: fashionImg, alt: '', position: 'center 20%' },
];

const collageCards: CollageCard[] = [
  { src: weddingImg2, alt: 'Mariage', className: 'w-40 h-52 top-0 left-4', rotate: -6 },
  { src: sportActionImg, alt: 'Sport', className: 'w-36 h-44 top-4 left-48', rotate: 5 },
  { src: portraitImg, alt: 'Mode', className: 'w-40 h-52 top-40 left-16', rotate: -4, position: '30% 15%' },
  { src: schoolImg, alt: 'Remise de diplôme', className: 'w-36 h-44 top-52 left-56', rotate: 6 },
];

const collagePreviewThumbs = [weddingImg2, sportActionImg, schoolImg, portraitImg, sportImg, weddingImg];

const categoriesList = [
  { label: 'Mariage & Réceptions', image: weddingImg },
  { label: 'Sport & Tournois', image: sportActionImg },
  { label: 'Remise de diplômes & Écoles', image: schoolImg },
  { label: 'Mode & Défilés', image: fashionImg },
];

export const LandingPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    fetchSubscriptionPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  return (
    <div className="bg-white min-h-screen text-[#111827]">
      {/* 1. HERO — photo réelle en fond assombri, texte blanc, galerie de photos flottante */}
      <section className="relative overflow-hidden min-h-[600px] lg:min-h-[640px] flex items-center bg-[#121212]">
        <HeroPhotoBackground slides={heroBackgroundSlides} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white backdrop-blur-sm">
                <Camera className="w-3.5 h-3.5 text-[#F25C05]" />
                <span>La référence SaaS pour photographes événementiels</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
                Vos photos. <br />
                Vos clients. <br />
                <span className="text-[#F25C05]">Une expérience plus simple.</span>
              </h1>

              <p className="text-base sm:text-lg text-neutral-300 max-w-xl font-normal leading-relaxed">
                Organisez, partagez et valorisez vos photos dans une galerie professionnelle que vos clients
                peuvent retrouver facilement. Fini les envois compressés sur WhatsApp.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button variant="primary" size="lg" onClick={() => navigate('/inscription-photographe')} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                  Devenir photographe
                </Button>
                <Button
                  variant="overlay"
                  size="lg"
                  onClick={() => document.getElementById('fonctionnement')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Découvrir comment ça marche
                </Button>
              </div>

              <div className="pt-6 border-t border-white/15 grid grid-cols-3 gap-4 text-xs text-neutral-400">
                <div>
                  <p className="font-bold text-white text-base">Originaux HD</p>
                  <p className="mt-0.5">Stockage privé & sécurisé</p>
                </div>
                <div>
                  <p className="font-bold text-white text-base">QR Code 1-Click</p>
                  <p className="mt-0.5">Accès direct sur événement</p>
                </div>
                <div>
                  <p className="font-bold text-white text-base">Monétisation</p>
                  <p className="mt-0.5">Wave, Orange Money & CB</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <PhotoCollage cards={collageCards} previewThumbs={collagePreviewThumbs} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMMENT ÇA FONCTIONNE */}
      <section id="fonctionnement" className="py-20 bg-[#F8F9FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">Flux d'expérience sans friction</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2">Comment ça fonctionne</h2>
            <p className="text-[#6B7280] text-sm sm:text-base mt-2">Du déclenchement de l'appareil à la livraison des souvenirs haute définition.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Créez votre événement', desc: 'Renseignez le nom, la date, le lieu et définissez vos sous-galeries.' },
              { step: '02', title: 'Importez vos photos', desc: 'Glissez-déposez vos clichés. Miniatures et previews filigranées sont générées automatiquement.' },
              { step: '03', title: 'Partagez votre galerie', desc: "Imprimez le QR code, projetez-le sur écran ou envoyez le lien sécurisé par WhatsApp." },
              { step: '04', title: 'Vos clients profitent', desc: 'Les invités consultent la galerie, sélectionnent leurs photos préférées et commandent en HD.' },
            ].map((item) => (
              <div key={item.step} className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs relative">
                <span className="text-xs font-mono font-bold text-[#F25C05] bg-[#FFF1EB] px-2 py-0.5 rounded">Étape {item.step}</span>
                <h3 className="text-lg font-bold text-[#111827] mt-4 mb-2">{item.title}</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. POUR LES PHOTOGRAPHES */}
      <section id="photographes" className="py-20 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">Espace Professionnel</span>
              <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2 mb-4">Pensé pour le quotidien des photographes</h2>
              <p className="text-[#6B7280] text-sm mb-8 leading-relaxed">
                Gagnez des heures après chaque prestation. Fini la gestion manuelle sur WhatsApp et la compression destructrice.
              </p>

              <div className="space-y-4">
                {[
                  { title: 'Gestion multi-galeries par événement', desc: 'Organisez vos événements en sous-dossiers (Cérémonie, Invités, Soirée).' },
                  { title: 'Filigrane automatique & protection des originaux', desc: 'Vos fichiers HD restent isolés dans un stockage privé. Les aperçus sont protégés par filigrane.' },
                  { title: 'QR Code instantané pour événements', desc: "Affichez ou imprimez un QR code dès le début de l'événement." },
                  { title: 'Vente directe & solde sécurisé', desc: 'Fixez vos tarifs, recevez vos gains via Wave, Orange Money ou carte bancaire.' },
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
                <Button variant="primary" onClick={() => navigate('/inscription-photographe')} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                  Postuler comme photographe
                </Button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-xl">
              <img src={photographerAvatar} alt="Photographe professionnel en plein travail" className="w-full h-[420px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. POUR LES CLIENTS */}
      <section id="clients" className="py-20 bg-[#F8F9FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-md">
              <img src={weddingImg} alt="Client consultant sa galerie" className="w-full h-[380px] object-cover" />
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">Expérience Invité & Client</span>
              <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2 mb-4">Retrouvez vos souvenirs en toute simplicité</h2>
              <p className="text-[#6B7280] text-sm mb-6 leading-relaxed">
                Scannez le QR code ou ouvrez le lien de l'événement pour accéder instantanément à vos photos.
              </p>

              <div className="space-y-4">
                {[
                  { title: 'Accès sans création de compte obligatoire', desc: 'Consultez la galerie directement depuis votre téléphone en scannant le QR code.' },
                  { title: 'Qualité native sans compression WhatsApp', desc: "Vos photos sont restituées dans leur piqué d'origine." },
                  { title: 'Sélection & commande en quelques clics', desc: 'Sélectionnez vos photos favorites et payez avec Wave ou Orange Money.' },
                  { title: 'Conservation garantie dans le temps', desc: "Accédez à votre espace souvenir plusieurs mois après l'événement." },
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

      {/* 5. CATÉGORIES */}
      <section id="categories" className="py-20 border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">Universalité</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2">Conçu pour toutes les catégories de photographie</h2>
            <p className="text-[#6B7280] text-sm mt-2">Chaque événement a ses spécificités : de la cérémonie intime au tournoi de stade.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoriesList.map((cat) => (
              <div key={cat.label} className="group relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-neutral-900 h-48 flex flex-col justify-end p-4">
                <img src={cat.image} alt={cat.label} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10">
                  <p className="text-xs font-bold text-white leading-snug">{cat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SÉCURITÉ */}
      <section className="py-20 bg-[#F8F9FA] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">Sécurité & Architecture</span>
            <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2">Vos originaux protégés à chaque étape</h2>
            <p className="text-[#6B7280] text-sm mt-2">Conçu pour respecter les droits d'auteur des photographes et la vie privée des clients.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#F25C05] mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-2">Galeries Privées & Codes PIN</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Protégez les événements familiaux ou corporatifs par un code chiffré. Seules les personnes autorisées peuvent y accéder.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#F25C05] mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-2">URLs Signées & Stockage Privé</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Les fichiers originaux ne sont jamais exposés publiquement. Les téléchargements sont validés via URLs signées à expiration automatique.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB]">
              <div className="w-10 h-10 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#F25C05] mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111827] mb-2">Filigrane Intelligent</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Filigrane appliqué côté serveur sur les previews publiques. La version HD propre n'est débloquée qu'après paiement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TARIFS */}
      {plans.length > 0 && (
        <section id="tarifs" className="py-20 border-b border-[#E5E7EB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F25C05]">Tarification Transparente</span>
              <h2 className="text-3xl font-bold tracking-tight text-[#111827] mt-2">Des forfaits adaptés à votre activité</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
              {plans.map((plan) => {
                const highlighted = plan.code === 'PRO';
                return (
                  <div
                    key={plan.id}
                    className={`p-8 rounded-xl shadow-xs flex flex-col justify-between relative ${
                      highlighted ? 'bg-[#121212] text-white border-2 border-[#F25C05] shadow-xl' : 'bg-white border border-[#E5E7EB]'
                    }`}
                  >
                    {highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F25C05] text-white text-[11px] font-bold uppercase px-3 py-0.5 rounded-full">
                        Le plus populaire
                      </div>
                    )}
                    <div>
                      <h3 className={`text-2xl font-bold mt-2 ${highlighted ? 'text-white' : 'text-[#111827]'}`}>{plan.name}</h3>
                      <p className={`text-3xl font-extrabold mt-4 mb-2 ${highlighted ? 'text-white' : 'text-[#111827]'}`}>
                        {plan.priceCfaPerMonth.toLocaleString('fr-FR')}{' '}
                        <span className={`text-sm font-normal ${highlighted ? 'text-neutral-400' : 'text-[#6B7280]'}`}>FCFA / mois</span>
                      </p>
                      <ul className={`space-y-3 text-xs mt-6 ${highlighted ? 'text-neutral-200' : 'text-[#111827]'}`}>
                        <li className="flex items-center gap-2">
                          <Check className={`w-4 h-4 ${highlighted ? 'text-[#F25C05]' : 'text-emerald-600'}`} />
                          {(plan.storageLimitMb / 1024).toFixed(0)} Go de stockage
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className={`w-4 h-4 ${highlighted ? 'text-[#F25C05]' : 'text-emerald-600'}`} />
                          {plan.maxActiveEvents ? `${plan.maxActiveEvents} événements actifs` : 'Événements illimités'}
                        </li>
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className={`w-4 h-4 ${highlighted ? 'text-[#F25C05]' : 'text-emerald-600'}`} /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-8">
                      <Button variant={highlighted ? 'primary' : 'secondary'} className="w-full" onClick={() => navigate('/inscription-photographe')}>
                        Choisir {plan.name}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 8. CTA FINAL */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight">Commencez à organiser vos photos autrement.</h2>
          <p className="text-base text-[#6B7280] mt-3 max-w-xl mx-auto">
            Rejoignez les photographes qui valorisent leur travail et simplifient la vie de leurs clients.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate('/inscription-photographe')} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
              Créer mon espace photographe
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[#121212] text-neutral-400 text-xs py-12 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#F25C05]" />
              <span className="font-bold text-white text-sm">Samay Natal — SaaS Photographie</span>
              <span className="text-[10px] text-neutral-500">• Dakar, Sénégal</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => navigate('/connexion')} className="hover:text-white transition-colors cursor-pointer text-[11px]">
                Connexion
              </button>
              <button onClick={() => navigate('/inscription-photographe')} className="hover:text-white transition-colors cursor-pointer text-[11px]">
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
