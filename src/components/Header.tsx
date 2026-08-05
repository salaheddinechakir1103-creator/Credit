import React, { useState } from 'react';
import {
  Search,
  Bell,
  Lock,
  Sun,
  Moon,
  Plus,
  Wallet,
  Globe,
  UserCheck,
  Sparkles,
  CloudCheck,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { getTranslation } from '../utils/translations';
import { Language } from '../types/creditManager';

interface HeaderProps {
  onOpenAddDebt: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddDebt, onOpenNotifications }) => {
  const { config, updateConfig, userProfile, notifications, searchQuery, setSearchQuery, lockApp, triggerSync } =
    useCreditManager();
  const t = getTranslation(config.language);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [showLangMenu, setShowLangMenu] = useState(false);

  const toggleTheme = () => {
    updateConfig({ theme: config.theme === 'dark' ? 'light' : 'dark' });
  };

  const changeLanguage = (lang: Language) => {
    updateConfig({ language: lang });
    setShowLangMenu(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                {t.appName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Pro 2.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Global Search input */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full ps-9 pe-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 end-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1 my-auto"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Add Debt Button */}
          <button
            onClick={onOpenAddDebt}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.addDebt}</span>
          </button>

          {/* Sync status button */}
          <button
            onClick={triggerSync}
            title={t.firebaseSync}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative hidden sm:flex items-center justify-center"
          >
            <CloudCheck className="w-5 h-5 text-emerald-500" />
          </button>

          {/* Notifications button */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all relative"
            title={t.notifications}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 end-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1 text-xs font-semibold"
              title={t.language}
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{config.language}</span>
            </button>

            {showLangMenu && (
              <div className="absolute end-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 text-sm">
                <button
                  onClick={() => changeLanguage('ar')}
                  className={`w-full text-start px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    config.language === 'ar' ? 'text-indigo-600 font-bold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  العربية (AR)
                </button>
                <button
                  onClick={() => changeLanguage('fr')}
                  className={`w-full text-start px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    config.language === 'fr' ? 'text-indigo-600 font-bold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  Français (FR)
                </button>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`w-full text-start px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    config.language === 'en' ? 'text-indigo-600 font-bold' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  English (EN)
                </button>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={t.theme}
          >
            {config.theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Lock App Button */}
          <button
            onClick={lockApp}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={t.lockApp}
          >
            <Lock className="w-5 h-5 text-slate-500 hover:text-slate-900 dark:hover:text-white" />
          </button>

          {/* User Profile Avatar */}
          <div className="ps-1 border-s border-slate-200 dark:border-slate-800">
            <img
              src={userProfile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
