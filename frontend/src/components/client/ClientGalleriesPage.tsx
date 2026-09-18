import React, { useEffect, useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { ErrorState } from '../common/ErrorState';
import { ClientGallerySummary } from '../../types/api';
import { fetchMyGalleries } from '../../services/orders';
import { navigate } from '../../lib/router';

export const ClientGalleriesPage: React.FC = () => {
  const [galleries, setGalleries] = useState<ClientGallerySummary[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false);
    setGalleries(null);
    fetchMyGalleries()
      .then(setGalleries)
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111827]">Mes galeries</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {galleries && galleries.length > 0
              ? `${galleries.length} galerie${galleries.length > 1 ? 's' : ''} achetée${galleries.length > 1 ? 's' : ''}`
              : 'Toutes les galeries que vous avez achetées, réunies au même endroit.'}
          </p>
        </div>

        {galleries === null && !loadError && (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {loadError && <ErrorState message="Impossible de charger vos galeries." onRetry={load} />}

        {galleries && galleries.length === 0 && !loadError && (
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-12 text-center bg-white">
            <div className="w-12 h-12 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] mx-auto mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#111827]">Vous n'avez encore acheté aucune galerie.</p>
            <p className="text-xs text-[#6B7280] mt-1">Vos achats apparaîtront ici automatiquement.</p>
          </div>
        )}

        {galleries && galleries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {galleries.map((g) => (
              <button
                key={g.eventSlug}
                onClick={() => navigate(`/g/${g.eventSlug}`)}
                className="text-left bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="aspect-[4/3] bg-[#121212] relative overflow-hidden">
                  {g.coverPhotoUrl ? (
                    <img
                      src={g.coverPhotoUrl}
                      alt={g.eventTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-[#111827] truncate">{g.eventTitle}</h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">{g.photographerBusinessName}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E7EB]">
                    <span className="text-[11px] text-[#6B7280]">
                      {g.purchasedPhotosCount} photo{g.purchasedPhotosCount > 1 ? 's' : ''} achetée
                      {g.purchasedPhotosCount > 1 ? 's' : ''}
                    </span>
                    <span className="text-[11px] font-semibold text-[#F25C05]">Voir →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
