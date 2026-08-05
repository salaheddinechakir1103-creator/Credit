import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Fingerprint,
  Trash2,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { getTranslation } from '../utils/translations';

export const BackupSecurityModal: React.FC = () => {
  const {
    config,
    updateConfig,
    exportDataJSON,
    importDataJSON,
    resetAllData,
    setPinCode,
    triggerSync,
  } = useCreditManager();
  const t = getTranslation(config.language);

  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length >= 4) {
      setPinCode(newPin);
      setPinSuccessMsg(true);
      setTimeout(() => setPinSuccessMsg(false), 3000);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const success = importDataJSON(content);
        if (success) {
          setImportStatus('تم استرجاع البيانات بنجاح!');
        } else {
          setImportStatus('خطأ: الملف غير صالح أو تالف.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.settings}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            الحماية برمز PIN، المزامنة السحابية وتصدير البيانات
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security & PIN Settings Box */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>{t.security}</span>
          </div>

          <form onSubmit={handleSavePin} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.setPin}</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="****"
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
                >
                  حفظ الرمز
                </button>
              </div>
              {pinSuccessMsg && (
                <span className="text-[11px] text-emerald-600 font-bold block mt-1">
                  ✓ تم حفظ رمز PIN بنجاح!
                </span>
              )}
            </div>
          </form>

          {/* Biometric Fingerprint Toggle */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {t.biometric}
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.biometricEnabled}
              onChange={(e) => updateConfig({ biometricEnabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Cloud Sync & Firebase Box */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <Cloud className="w-4 h-4 text-indigo-600" />
              <span>{t.firebaseSync}</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold">
              متصل
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            تضمن المزامنة السحابية حفظ قاعدة بياناتك وتزامنها مع حسابك على Firebase
          </p>

          <button
            onClick={triggerSync}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl hover:bg-indigo-100 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>مزامنة فورية الآن</span>
          </button>
        </div>
      </div>

      {/* JSON Backup & Restore Box */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          تصدير واسترجاع قاعدة البيانات (JSON Backup)
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={exportDataJSON}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{t.backupData}</span>
          </button>

          <label className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>{t.restoreData}</span>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>
        </div>

        {importStatus && (
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 pt-1">
            {importStatus}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
          <Trash2 className="w-4 h-4" />
          <span>منطقة الخطر - استعادة ضبط المصنع</span>
        </div>
        <p className="text-xs text-rose-700 dark:text-rose-400/80">
          مسح كافة البيانات وإعادة التطبيق للوضع الافتراضي الأولي
        </p>
        <button
          onClick={() => {
            if (confirm(t.confirmClearData)) resetAllData();
          }}
          className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow transition-all"
        >
          {t.clearAllData}
        </button>
      </div>
    </div>
  );
};
