import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Award,
  Trash2,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageId } from '../components/layout/Sidebar';
import { AppNotification } from '../types';

interface NotificationsPageProps {
  onNavigate: (page: PageId) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const [filterType, setFilterType] = useState<string>('All');

  const filtered = notifications.filter((n) => {
    if (filterType === 'Unread') return !n.read;
    if (filterType === 'Alerts') return n.type === 'error' || n.type === 'warning';
    return true;
  });

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            Security & Workflow Notification Center
          </h2>
          <p className="text-xs text-slate-400">
            Real-time event alerts covering approvals, wiping failures, and compliance deadlines
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterType('All')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'All' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('Unread')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'Unread' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
            <button
              onClick={() => setFilterType('Alerts')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                filterType === 'Alerts' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Critical Alerts
            </button>
          </div>

          <button
            onClick={() => markAllNotificationsAsRead()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 font-medium"
          >
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No notifications match your current filter.
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                markNotificationAsRead(notif.id);
                if (notif.linkPage) onNavigate(notif.linkPage as PageId);
              }}
              className={`p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-800/40 transition-colors ${
                !notif.read ? 'bg-slate-950/40 border-l-2 border-l-cyan-400' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {getIcon(notif.type)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200 text-xs">{notif.title}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                  {notif.assetId && (
                    <span className="inline-block mt-1.5 font-mono text-[11px] text-cyan-400 hover:underline">
                      Inspect Asset: {notif.assetId} →
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-mono shrink-0 text-right">
                {notif.timestamp}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
