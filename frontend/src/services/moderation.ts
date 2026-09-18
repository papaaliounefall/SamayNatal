import { api } from '../lib/api';
import { ModerationAction, ModerationActionType, Paginated, Report } from '../types/api';

export interface AdminReportListParams {
  status?: string;
}

export function adminListReports(params: AdminReportListParams = {}): Promise<Paginated<Report>> {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  query.set('page_size', '100');
  return api.get(`/api/admin/reports/?${query.toString()}`);
}

export function adminResolveReport(id: string, actionType: ModerationActionType, notes = ''): Promise<Report> {
  return api.post(`/api/admin/reports/${id}/resolve/`, { actionType, notes });
}

export function adminListModerationActions(): Promise<Paginated<ModerationAction>> {
  return api.get('/api/admin/moderation-actions/?page_size=100');
}
