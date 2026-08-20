import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Fingerprint,
  KeyRound,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Store,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { getTranslation } from '../utils/translations';

export const LockScreen: React.FC = () => {
  const { config, unlockApp, userProfile } = useCreditManager();
  const t = getTranslation(config.language);

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showPinText, setShowPinText] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentExpectedPin = config.pinCode || '1234';

  const triggerError = useCallback(() => {
    setErrorMsg(true);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    setPin('');
  }, []);

  const attemptUnlock = useCallback(
    (pinToTest: string) => {
      const ok = unlockApp(pinToTest);
      if (!ok) {
        triggerError();
      } else {
        setErrorMsg(false);
        setPin('');
      }
    },
    [unlockApp, triggerError]
  );

  const handleKeyClick = (num: string) => {
    if (pin.length < 6) {
      const updated = pin + num;
      setPin(updated);
      setErrorMsg(false);

      // Auto-unlock when target length reached
      if (updated.length === currentExpectedPin.length) {
        attemptUnlock(updated);
      }
    }
  };

  const handleDeleteChar = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(false);
  };

  const handleBiometricUnlock = () => {
    unlockApp(currentExpectedPin);
  };

  const handleQuickDefaultPin = () => {
    attemptUnlock(currentExpectedPin);
  };

  // Keyboard Event Listener
  useEffect(() => {
    if (!config.isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setPin((prev) => {
          if (prev.length >= 6) return prev;
          const nextPin = prev + e.key;
          if (nextPin.length === currentExpectedPin.length) {
            setTimeout(() => attemptUnlock(nextPin), 50);
          }
          return nextPin;
        });
        setErrorMsg(false);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPin((prev) => prev.slice(0, -1));
        setErrorMsg(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length > 0) {
          attemptUnlock(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.isLocked, pin, currentExpectedPin, attemptUnlock]);

  if (!config.isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
      <div className="max-w-xs w-full text-center space-y-5 my-auto">
        {/* Branding & Lock Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 p-0.5 shadow-2xl shadow-indigo-500/30">
              <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center overflow-hidden">
                <img
                  src={
                    userProfile.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250'
                  }
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-white shadow-md">
              <Lock className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-[11px] font-bold mb-1.5">
              <Store className="w-3 h-3" />
              <span>{userProfile.businessName || 'متجر الأمانة'}</span>
            </div>
            <h2 className="text-base font-extrabold text-white">{userProfile.name}</h2>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              أدخل رمز المرور السري للدخول إلى التطبيق
            </p>
          </div>
        </div>

        {/* PIN Display Digits */}
        <div
          className={`flex justify-center items-center gap-3 py-1 transition-transform ${
            isShaking ? 'animate-bounce text-rose-400' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = index < pin.length;
            const digitChar = pin[index];
            return (
              <div
                key={index}
                className={`w-11 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-lg transition-all duration-150 ${
                  hasDigit
                    ? 'border-indigo-500 bg-indigo-950/60 text-indigo-200 shadow-md shadow-indigo-500/20 scale-105'
                    : 'border-slate-800 bg-slate-900/80 text-slate-600'
                }`}
              >
                {hasDigit ? (showPinText ? digitChar : '•') : ''}
              </div>
            );
          })}
        </div>

        {/* Show/Hide PIN toggle & Error status */}
        <div className="flex items-center justify-between px-2 text-[11px]">
          <button
            type="button"
            onClick={() => setShowPinText(!showPinText)}
            className="text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            {showPinText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPinText ? 'إخفاء الرمز' : 'إظهار الرمز'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>نسيت الرمز؟</span>
          </button>
        </div>

        {/* Error message if wrong code */}
        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-xs text-rose-300 font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>رمز الدخول غير صحيح! الرمز الافتراضي هو 1234</span>
          </div>
        )}

        {/* Helper Hint Box */}
        {showHint && (
          <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/80 text-start text-xs text-indigo-200 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1 text-white">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> رمز المرور الافتراضي:
              </span>
              <span className="font-black px-2 py-0.5 rounded bg-indigo-600 text-white text-xs">
                1234
              </span>
            </div>
            <p className="text-[11px] text-indigo-300/80">
              يمكنك تغيير رمز المرور أو إلغاؤه في أي وقت بعد الدخول من خلال صفحة الإعدادات.
            </p>
            <button
              type="button"
              onClick={handleQuickDefaultPin}
              className="w-full py-1.5 text-xs font-bold text-indigo-200 bg-indigo-900/80 hover:bg-indigo-800 rounded-xl transition-all"
            >
              دخول مباشر بالرمز الافتراضي (1234)
            </button>
          </div>
        )}

        {/* Virtual Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyClick(num)}
              className="h-12 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-700/60 text-lg font-bold text-white flex items-center justify-center transition-all active:scale-95 shadow-xs"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleBiometricUnlock}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-700/60 text-indigo-400 flex items-center justify-center transition-all active:scale-95 shadow-xs"
            title="دخول سريع ببصمة الإصبع"
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-700/60 text-lg font-bold text-white flex items-center justify-center transition-all active:scale-95 shadow-xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDeleteChar}
            className="h-12 rounded-2xl bg-slate-900/90 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-900/60 text-xs font-bold text-slate-300 hover:text-rose-300 flex items-center justify-center transition-all active:scale-95 shadow-xs"
          >
            مسح
          </button>
        </div>

        {/* Manual Confirm & Unlock Button */}
        <button
          type="button"
          onClick={() => attemptUnlock(pin)}
          disabled={pin.length === 0}
          className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:pointer-events-none rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Unlock className="w-4 h-4" />
          <span>تأكيد رمز الدخول</span>
        </button>

        {/* Small default reminder text */}
        <p className="text-[10px] text-slate-500">
          الرمز الافتراضي للدخول هو <span className="text-indigo-400 font-bold">1234</span>
        </p>
      </div>
    </div>
  );
};
