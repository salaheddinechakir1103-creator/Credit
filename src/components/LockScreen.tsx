import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Store,
  Eye,
  EyeOff,
  Delete,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { getTranslation } from '../utils/translations';

const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_DURATION = 30; // seconds

export const LockScreen: React.FC = () => {
  const { config, unlockApp, userProfile } = useCreditManager();
  const t = getTranslation(config.language);

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showPinText, setShowPinText] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0 && failedAttempts >= MAX_FAILED_ATTEMPTS) {
      setFailedAttempts(0);
      setErrorMsg(null);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cooldown, failedAttempts]);

  const triggerError = useCallback(() => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    setPin('');

    if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
      setCooldown(COOLDOWN_DURATION);
      setErrorMsg(`تم تجاوز الحد الأقصى للمحاولات! تم تجميد الدخول مؤقتاً لمدة ${COOLDOWN_DURATION} ثانية.`);
    } else {
      const remaining = MAX_FAILED_ATTEMPTS - nextAttempts;
      setErrorMsg(`رمز المرور غير صحيح! متبقي ${remaining} محاولات قبل التجميد المؤقت.`);
    }
  }, [failedAttempts]);

  const attemptUnlock = useCallback(
    (pinToTest: string) => {
      if (cooldown > 0) return;
      if (!pinToTest || pinToTest.length < 4) {
        setErrorMsg('يرجى إدخال 4 أرقام على الأقل');
        return;
      }

      const isSuccess = unlockApp(pinToTest);
      if (!isSuccess) {
        triggerError();
      } else {
        setErrorMsg(null);
        setPin('');
        setFailedAttempts(0);
      }
    },
    [unlockApp, triggerError, cooldown]
  );

  const handleKeyClick = (num: string) => {
    if (cooldown > 0) return;
    if (pin.length < 6) {
      const updated = pin + num;
      setPin(updated);
      setErrorMsg(null);

      // Auto-unlock when reaching 4 or 6 digits if matched
      const targetLen = config.pinCode?.length || 4;
      if (updated.length === targetLen) {
        attemptUnlock(updated);
      }
    }
  };

  const handleDeleteChar = () => {
    if (cooldown > 0) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClearAll = () => {
    if (cooldown > 0) return;
    setPin('');
    setErrorMsg(null);
  };

  // Physical Keyboard listener
  useEffect(() => {
    if (!config.isLocked || cooldown > 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        setPin((prev) => {
          if (prev.length >= 6) return prev;
          const nextPin = prev + e.key;
          const targetLen = config.pinCode?.length || 4;
          if (nextPin.length === targetLen) {
            setTimeout(() => attemptUnlock(nextPin), 50);
          }
          return nextPin;
        });
        setErrorMsg(null);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPin((prev) => prev.slice(0, -1));
        setErrorMsg(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length >= 4) {
          attemptUnlock(pin);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPin('');
        setErrorMsg(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.isLocked, pin, config.pinCode, attemptUnlock, cooldown]);

  if (!config.isLocked) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
      <div className="max-w-xs w-full text-center space-y-6 my-auto">
        {/* Branding & Lock Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-2xl shadow-indigo-500/20">
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
            <div className="absolute -bottom-1 -end-1 w-7 h-7 rounded-full bg-indigo-600 border-2 border-slate-950 flex items-center justify-center text-white shadow-md">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-bold mb-1">
              <Store className="w-3 h-3 text-indigo-400" />
              <span>{userProfile.businessName || 'متجر الأمانة'}</span>
            </div>
            <h2 className="text-base font-extrabold text-white">{userProfile.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              النظام محمي ومقفل • أدخل رمز المرور السري
            </p>
          </div>
        </div>

        {/* PIN Display Indicators */}
        <div
          className={`flex justify-center items-center gap-2.5 py-1 transition-transform ${
            isShaking ? 'animate-bounce' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const hasDigit = index < pin.length;
            const digitChar = pin[index];
            return (
              <div
                key={index}
                className={`w-12 h-13 rounded-2xl border-2 flex items-center justify-center font-black text-xl transition-all duration-150 ${
                  hasDigit
                    ? 'border-indigo-500 bg-indigo-950/70 text-indigo-200 shadow-md shadow-indigo-500/20 scale-105'
                    : 'border-slate-800 bg-slate-900 text-slate-600'
                }`}
              >
                {hasDigit ? (showPinText ? digitChar : '•') : ''}
              </div>
            );
          })}
        </div>

        {/* Show/Hide PIN toggle */}
        <div className="flex items-center justify-center text-[11px]">
          <button
            type="button"
            onClick={() => setShowPinText(!showPinText)}
            className="text-slate-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-900"
          >
            {showPinText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPinText ? 'إخفاء الأرقام' : 'إظهار الأرقام'}</span>
          </button>
        </div>

        {/* Cooldown Timer Alert */}
        {cooldown > 0 ? (
          <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-700 text-xs text-amber-200 font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span>الدخول مجمد مؤقتاً: انتظر {cooldown} ثانية</span>
          </div>
        ) : errorMsg ? (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-800 text-xs text-rose-300 font-bold flex items-center justify-center gap-2 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {/* Secure Numeric Keypad (No fake shortcuts or backdoors) */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              disabled={cooldown > 0}
              onClick={() => handleKeyClick(num)}
              className="h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-600/50 text-xl font-bold text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-xs"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            disabled={cooldown > 0 || pin.length === 0}
            onClick={handleClearAll}
            className="h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            title="إلغاء الكل"
          >
            مسح الكل
          </button>

          <button
            type="button"
            disabled={cooldown > 0}
            onClick={() => handleKeyClick('0')}
            className="h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-600/50 text-xl font-bold text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none shadow-xs"
          >
            0
          </button>

          <button
            type="button"
            disabled={cooldown > 0 || pin.length === 0}
            onClick={handleDeleteChar}
            className="h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            title="حذف رقم"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Manual Confirm & Unlock Button */}
        <button
          type="button"
          onClick={() => attemptUnlock(pin)}
          disabled={pin.length < 4 || cooldown > 0}
          className="w-full py-3.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Unlock className="w-4 h-4" />
          <span>فتح وقفل التطبيق</span>
        </button>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>حماية مشددة ومشفرة بالكامل</span>
        </div>
      </div>
    </div>
  );
};
