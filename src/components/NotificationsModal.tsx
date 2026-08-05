import React from 'react';
import { X, Bell, AlertTriangle, CheckCircle2, Clock, Check } from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatDate } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface NotificationsModalProps {
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const { notifications, markNotificationRead, config } = useCreditManager();
  const t = getTranslation(config.language);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold">{t.notifications}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mark all as read bar */}
        {notifications.length > 0 && (
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">{notifications.length} إشعار</span>
            <button
              onClick={() => markNotificationRead()}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> {t.markAllRead}
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="p-6 max-h-96 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">{t.noNotifications}</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-75'
                    : 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 font-medium'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      notif.type === 'overdue'
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                        : notif.type === 'payment'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    }`}
                  >
                    {notif.type === 'overdue' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : notif.type === 'payment' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {formatDate(notif.date, config.language)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
