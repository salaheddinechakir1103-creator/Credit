import React, { useState } from 'react';
import { Lock, Fingerprint, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { getTranslation } from '../utils/translations';

export const LockScreen: React.FC = () => {
  const { config, unlockApp, userProfile } = useCreditManager();
  const t = getTranslation(config.language);

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);

  const handleKeyClick = (num: string) => {
    if (pin.length < 6) {
      const updated = pin + num;
      setPin(updated);
      setErrorMsg(false);
    }
  };

  const handleDeleteChar = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleUnlock = () => {
    const ok = unlockApp(pin);
    if (!ok) {
      setErrorMsg(true);
      setPin('');
    }
  };

  const handleBiometricUnlock = () => {
    // Simulated fingerprint unlock
    unlockApp(config.pinCode || '');
  };

  if (!config.isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-xs w-full text-center space-y-6">
        {/* User Info Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600/30 border border-indigo-500/40 p-1 relative shadow-xl shadow-indigo-500/20">
            <img
              src={
                userProfile.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'
              }
              alt={userProfile.name}
              className="w-full h-full rounded-2xl object-cover"
            />
            <div className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-white">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold">{userProfile.name}</h2>
            <p className="text-xs text-indigo-300/80">{t.enterPin}</p>
          </div>
        </div>

        {/* PIN Dots Indicator */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                i < pin.length
                  ? 'bg-indigo-500 border-indigo-400 scale-125'
                  : 'border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> رمز الـ PIN غير صحيح، حاول مجدداً
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyClick(num)}
              className="h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-base font-bold text-white flex items-center justify-center transition-all active:scale-95"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleBiometricUnlock}
            className="h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-indigo-400 flex items-center justify-center transition-all"
            title={t.biometric}
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-base font-bold text-white flex items-center justify-center transition-all active:scale-95"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDeleteChar}
            className="h-12 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-center transition-all"
          >
            مسح
          </button>
        </div>

        {/* Unlock Confirm Button */}
        <button
          onClick={handleUnlock}
          className="w-full py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
        >
          تأكيد وإلغاء القفل
        </button>
      </div>
    </div>
  );
};
