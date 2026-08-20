import React from 'react';
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileSpreadsheet,
  History,
  BarChart3,
  Settings,
  User,
  AlertTriangle,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { getTranslation } from '../utils/translations';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, config, debts, invoices } = useCreditManager();
  const t = getTranslation(config.language);

  // Overdue count badge
  const overdueCount = debts.filter((d) => d.status === 'overdue').length;

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'customers', label: t.customers, icon: Users },
    {
      id: 'debts',
      label: t.debts,
      icon: Receipt,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    { id: 'invoices', label: 'الفواتير', icon: FileSpreadsheet },
    { id: 'transactions', label: t.transactions, icon: History },
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'settings', label: t.settings, icon: Settings },
    { id: 'profile', label: t.profile, icon: User },
  ];

  return (
    <>
      {/* Desktop Navigation Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 shrink-0 p-4 min-h-[calc(100vh-4rem)] sticky top-16">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-bold flex items-center gap-1 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Storage/Status Widget at bottom of Sidebar */}
        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-xs">
            <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-300 mb-1">
              <span>{t.firebaseSync}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-indigo-600/80 dark:text-indigo-400/80 text-[11px] leading-tight">
              {config.lastSyncDate ? `${t.syncSuccess}` : 'Offline Local Storage'}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-lg">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium relative transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] leading-none truncate max-w-[64px]">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-1 end-2 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
