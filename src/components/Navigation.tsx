import React, { useState } from 'react';
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
  MoreHorizontal,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { getTranslation } from '../utils/translations';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, config, debts } = useCreditManager();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const t = getTranslation(config.language);

  // Overdue count badge
  const overdueCount = debts.filter((d) => d.status === 'overdue').length;

  const allNavItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'ai_assistant', label: 'المستشار الذكي AI', icon: Sparkles, isAi: true },
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

  // Secondary items in the "More" menu
  const isSecondaryActive = ['reports', 'settings', 'profile'].includes(activeTab);

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Desktop Navigation Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 shrink-0 p-4 min-h-[calc(100vh-4rem)] sticky top-16">
        <div className="space-y-1">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                    : item.isAi
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.isAi ? 'text-amber-500 animate-pulse' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.isAi ? (
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-black flex items-center gap-1 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    Gemini ✨
                  </span>
                ) : item.badge ? (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-bold flex items-center gap-1 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {item.badge}
                  </span>
                ) : null}
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

      {/* Mobile Bottom Navigation Bar - with swipeable items & more sheet */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 py-1 shadow-xl">
        <div className="flex items-center justify-between">
          {/* Main 4 tabs */}
          {allNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-xs font-medium relative transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] leading-none truncate">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-1 end-3 w-2 h-2 rounded-full bg-rose-500" />
                )}
                {isActive && (
                  <span className="w-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}

          {/* Transactions Tab */}
          {(() => {
            const item = allNavItems[4]; // transactions
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-xs font-medium relative transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] leading-none truncate">{item.label}</span>
                {isActive && (
                  <span className="w-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-0.5" />
                )}
              </button>
            );
          })()}

          {/* "More / المزيد" Menu Button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl text-xs font-medium relative transition-all ${
              isSecondaryActive || showMoreMenu
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MoreHorizontal className={`w-5 h-5 transition-transform ${isSecondaryActive ? 'scale-110' : ''}`} />
            <span className="text-[10px] leading-none truncate">المزيد</span>
            {isSecondaryActive && (
              <span className="w-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-0.5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile "More" Bottom Sheet Modal */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Backdrop dismiss */}
          <div
            className="flex-1"
            onClick={() => setShowMoreMenu(false)}
          />

          {/* Drawer content */}
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    جميع أقسام التطبيق
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    الوصول السريع إلى التقارير والإعدادات والملف
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of all Pages in Grid / List */}
            <div className="space-y-1.5">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {item.badge} متأخر
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 opacity-50 ${isActive ? 'text-white' : ''}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
