import { api } from '../lib/api';
import { Paginated, PhotographerProfile, Wallet } from '../types/api';

export interface PhotographerRegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  businessName: string;
  city: string;
  country: string;
  bio?: string;
  specialties: string[];
  portfolioUrl?: string;
  acceptedTerms: boolean;
}

export function registerPhotographer(data: PhotographerRegisterPayload): Promise<PhotographerProfile> {
  return api.post('/api/photographers/register/', data);
}

export function fetchMyProfile(): Promise<PhotographerProfile> {
  return api.get('/api/photographers/me/');
}

export function updateMyProfile(data: Partial<PhotographerProfile>): Promise<PhotographerProfile> {
  return api.patch('/api/photographers/me/', data);
}

export function fetchMyWallet(): Promise<Wallet> {
  return api.get('/api/photographers/me/wallet/');
}

export interface AdminPhotographerListParams {
  status?: string;
  search?: string;
}

export function adminListPhotographers(params: AdminPhotographerListParams = {}): Promise<Paginated<PhotographerProfile>> {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return api.get(`/api/admin/photographers/${qs ? `?${qs}` : ''}`);
}

export function adminApprovePhotographer(id: string, reason?: string): Promise<PhotographerProfile> {
  return api.post(`/api/admin/photographers/${id}/approve/`, { reason });
}

export function adminRejectPhotographer(id: string, reason?: string): Promise<PhotographerProfile> {
  return api.post(`/api/admin/photographers/${id}/reject/`, { reason });
}

export function adminSuspendPhotographer(id: string, reason?: string): Promise<PhotographerProfile> {
  return api.post(`/api/admin/photographers/${id}/suspend/`, { reason });
}

export function adminReinstatePhotographer(id: string, reason?: string): Promise<PhotographerProfile> {
  return api.post(`/api/admin/photographers/${id}/reinstate/`, { reason });
}
