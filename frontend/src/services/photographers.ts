import { api } from '../lib/api';
import { AdminPayoutRequest, Paginated, PayoutMethod, PayoutRequest, PhotographerProfile, Wallet } from '../types/api';

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

export function fetchAvailablePayoutBalance(): Promise<{ availableBalanceCfa: number }> {
  return api.get('/api/payouts/available-balance/');
}

export function fetchMyPayouts(): Promise<Paginated<PayoutRequest>> {
  return api.get('/api/payouts/?page_size=100');
}

export function requestPayout(data: { amountCfa: number; method: PayoutMethod; phoneNumber: string }): Promise<PayoutRequest> {
  return api.post('/api/payouts/', data);
}

export interface AdminPayoutListParams {
  status?: string;
}

export function adminListPayouts(params: AdminPayoutListParams = {}): Promise<Paginated<AdminPayoutRequest>> {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  query.set('page_size', '100');
  return api.get(`/api/admin/payouts/?${query.toString()}`);
}

export function adminApprovePayout(id: string, note?: string): Promise<AdminPayoutRequest> {
  return api.post(`/api/admin/payouts/${id}/approve/`, { note });
}

export function adminRejectPayout(id: string, note?: string): Promise<AdminPayoutRequest> {
  return api.post(`/api/admin/payouts/${id}/reject/`, { note });
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
