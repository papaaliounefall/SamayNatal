import { api } from '../lib/api';
import {
  EventCategory,
  EventDetail,
  EventStatus,
  Gallery,
  GalleryPrivacy,
  Paginated,
  PublicEvent,
  WatermarkPosition,
} from '../types/api';

export interface CreateEventPayload {
  title: string;
  description?: string;
  date: string;
  location?: string;
  category: EventCategory;
  privacy: GalleryPrivacy;
  accessPin?: string;
  coverPhotoUrl?: string;
  defaultPricePerPhotoCfa: number;
  packPriceCfa?: number;
  fullGalleryPriceCfa?: number;
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  status?: EventStatus;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkPosition?: WatermarkPosition;
  watermarkOpacity?: number;
}

export function createEvent(data: CreateEventPayload): Promise<EventDetail> {
  return api.post('/api/events/', data);
}

export function fetchMyEvents(): Promise<Paginated<EventDetail>> {
  return api.get('/api/events/?page_size=100');
}

export function fetchMyEvent(id: string): Promise<EventDetail> {
  return api.get(`/api/events/${id}/`);
}

export function updateEvent(id: string, data: UpdateEventPayload): Promise<EventDetail> {
  return api.patch(`/api/events/${id}/`, data);
}

export function createGallery(eventId: string, name: string, privacy: GalleryPrivacy = 'PUBLIC'): Promise<Gallery> {
  return api.post('/api/galleries/', { event: eventId, name, privacy });
}

export function qrCodeUrl(eventId: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8010';
  return `${base}/api/events/${eventId}/qr_code/`;
}

export function fetchPublicEvent(slug: string): Promise<PublicEvent> {
  return api.get(`/api/public/events/${slug}/`);
}

export function unlockEvent(slug: string, pin: string): Promise<{ unlocked: boolean }> {
  return api.post(`/api/public/events/${slug}/unlock/`, { pin });
}
