import React, { useState } from 'react';
import { User, Mail, Building, Phone, Globe, Moon, Sun, DollarSign, LogOut, Check } from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { getTranslation } from '../utils/translations';
import { Currency, Language } from '../types/creditManager';

export const ProfileSettings: React.FC = () => {
  const { userProfile, updateUserProfile, config, updateConfig, lockApp } = useCreditManager();
  const t = getTranslation(config.language);

  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [businessName, setBusinessName] = useState(userProfile.businessName);
  const [phone, setPhone] = useState(userProfile.phone);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, email, businessName, phone, avatarUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* User Header Profile Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col sm:flex-row items-center gap-6">
        <img
          src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'}
          alt={name}
          className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500/30 shrink-0"
        />
        <div className="text-center sm:text-start flex-1">
          <h2 className="text-lg font-bold">{name}</h2>
          <p className="text-xs text-indigo-200 mt-0.5">{businessName}</p>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            <span>{email}</span>
            <span>•</span>
            <span>{phone}</span>
          </div>
        </div>
        <button
          onClick={lockApp}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all shadow shrink-0"
        >
          <LogOut className="w-4 h-4 text-slate-700" />
          <span>{t.lockApp}</span>
        </button>
      </div>

      {/* Edit Profile Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">تعديل بيانات الحساب والمتجر</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المتجر / النشاط التجاري</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {saved ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> تم تحديث البيانات بنجاح!
              </span>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all active:scale-95"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>

      {/* App Preferences Box (Currency, Language, Theme) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">تفضيلات التطبيق والعملة</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.currency}</label>
            <select
              value={config.currency}
              onChange={(e) => updateConfig({ currency: e.target.value as Currency })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              <option value="MAD">{t.mad}</option>
              <option value="USD">{t.usd}</option>
              <option value="EUR">{t.eur}</option>
            </select>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.language}</label>
            <select
              value={config.language}
              onChange={(e) => updateConfig({ language: e.target.value as Language })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              <option value="ar">العربية (Arabic)</option>
              <option value="fr">Français (French)</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.theme}</label>
            <select
              value={config.theme}
              onChange={(e) => updateConfig({ theme: e.target.value as any })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              <option value="light">{t.lightMode}</option>
              <option value="dark">{t.darkMode}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
