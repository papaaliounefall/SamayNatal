import { api } from '../lib/api';
import { AppNotification, Paginated } from '../types/api';

export function fetchNotifications(): Promise<Paginated<AppNotification>> {
  return api.get('/api/notifications/?page_size=20');
}

export function fetchUnreadNotificationCount(): Promise<{ unreadCount: number }> {
  return api.get('/api/notifications/unread-count/');
}

export function markNotificationRead(id: string): Promise<AppNotification> {
  return api.post(`/api/notifications/${id}/read/`);
}

export function markAllNotificationsRead(): Promise<void> {
  return api.post('/api/notifications/read-all/');
}
