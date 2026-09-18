import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { AppNotification } from '../../types/api';
import { fetchNotifications, fetchUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '../../services/notifications';
import { navigate } from '../../lib/router';

const POLL_INTERVAL_MS = 30_000;

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoadedList, setHasLoadedList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshUnreadCount = () => {
    fetchUnreadNotificationCount()
      .then((res) => setUnreadCount(res.unreadCount))
      .catch(() => {});
  };

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      fetchNotifications()
        .then((res) => {
          setNotifications(res.results);
          setHasLoadedList(true);
        })
        .catch(() => {});
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    setIsOpen(false);
    if (!notification.readAt) {
      markNotificationRead(notification.id).catch(() => {});
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)));
    }
    if (notification.actionUrl) navigate(notification.actionUrl);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead().catch(() => {});
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} non lues)` : 'Notifications'}
        className="relative p-2 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#F25C05] text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-xs font-bold text-[#111827]">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-[11px] text-[#F25C05] font-semibold hover:underline cursor-pointer flex items-center gap-1">
                <Check className="w-3 h-3" /> Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!hasLoadedList ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-xs text-[#6B7280] text-center py-8 px-4">Aucune notification pour l'instant.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F8F9FA] transition-colors cursor-pointer flex items-start gap-2 ${
                    !n.readAt ? 'bg-[#FFF1EB]/30' : ''
                  }`}
                >
                  {!n.readAt && <span className="w-1.5 h-1.5 rounded-full bg-[#F25C05] mt-1.5 shrink-0" />}
                  <div className={`min-w-0 ${n.readAt ? 'pl-3.5' : ''}`}>
                    <p className={`text-xs ${!n.readAt ? 'font-bold text-[#111827]' : 'font-medium text-[#374151]'}`}>{n.title}</p>
                    {n.body && <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-neutral-400 font-mono mt-1">{relativeTime(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
