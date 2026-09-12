import { api } from '../lib/api';
import { AuditLogEntry, Paginated, PlatformSettingsData } from '../types/api';

export function fetchAuditLogs(): Promise<Paginated<AuditLogEntry>> {
  return api.get('/api/admin/audit-logs/?page_size=50');
}

export function fetchPlatformSettings(): Promise<PlatformSettingsData> {
  return api.get('/api/admin/settings/');
}

export function updateCommissionRate(commissionRate: number): Promise<PlatformSettingsData> {
  return api.patch('/api/admin/settings/', { commissionRate });
}
