import { api } from '../lib/api';
import { AdminOrder, AdminStats, AuditLogEntry, Paginated, PlatformSettingsData, SystemHealth } from '../types/api';

export function fetchAuditLogs(): Promise<Paginated<AuditLogEntry>> {
  return api.get('/api/admin/audit-logs/?page_size=50');
}

export function fetchPlatformSettings(): Promise<PlatformSettingsData> {
  return api.get('/api/admin/settings/');
}

export function updateCommissionRate(commissionRate: number): Promise<PlatformSettingsData> {
  return api.patch('/api/admin/settings/', { commissionRate });
}

export function fetchAdminStats(): Promise<AdminStats> {
  return api.get('/api/admin/stats/');
}

export function fetchSystemHealth(): Promise<SystemHealth> {
  return api.get('/api/admin/health/');
}

export interface AdminOrderListParams {
  paymentStatus?: string;
  search?: string;
}

export function adminListOrders(params: AdminOrderListParams = {}): Promise<Paginated<AdminOrder>> {
  const query = new URLSearchParams();
  if (params.paymentStatus && params.paymentStatus !== 'ALL') query.set('payment_status', params.paymentStatus);
  if (params.search) query.set('search', params.search);
  query.set('page_size', '100');
  return api.get(`/api/admin/orders/?${query.toString()}`);
}
