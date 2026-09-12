import { api, apiUpload } from '../lib/api';
import { Paginated, Photo, PublicPhoto } from '../types/api';

export function fetchMyPhotos(eventId: string): Promise<Paginated<Photo>> {
  return api.get(`/api/photos/?event=${eventId}&page_size=500`);
}

export function fetchMyPhoto(id: string): Promise<Photo> {
  return api.get(`/api/photos/${id}/`);
}

export function deletePhoto(id: string): Promise<void> {
  return api.delete(`/api/photos/${id}/`);
}

export interface UploadResult {
  created: Photo[];
  errors: { filename: string; error: string }[];
}

export function uploadPhotos(
  eventId: string,
  galleryId: string,
  files: File[],
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return apiUpload(`/api/events/${eventId}/galleries/${galleryId}/photos/upload/`, formData, onProgress);
}

export function fetchPublicGalleryPhotos(
  eventSlug: string,
  galleryId: string,
  clientEmail?: string
): Promise<PublicPhoto[]> {
  const qs = clientEmail ? `?client_email=${encodeURIComponent(clientEmail)}` : '';
  return api.get(`/api/public/events/${eventSlug}/galleries/${galleryId}/photos/${qs}`);
}

export function requestHdDownload(photoId: string, clientEmail: string): Promise<{ downloadUrl: string; expiresIn: number }> {
  return api.post(`/api/photos/${photoId}/download/`, { clientEmail });
}
