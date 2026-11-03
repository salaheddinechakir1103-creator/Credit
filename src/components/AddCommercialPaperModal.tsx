import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  Landmark,
  User,
  Camera,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import {
  CommercialPaper,
  CommercialPaperType,
  CommercialPaperDirection,
  CommercialPaperStatus,
} from '../types/creditManager';
import { formatCurrency } from '../utils/formatters';

interface AddCommercialPaperModalProps {
  paperToEdit?: CommercialPaper | null;
  defaultCustomerId?: string;
  defaultType?: CommercialPaperType;
  defaultDirection?: CommercialPaperDirection;
  onClose: () => void;
}

export const MOROCCAN_BANKS = [
  'التجاري وفا بنك (Attijariwafa Bank)',
  'البنك الشعبي (Banque Populaire)',
  'بنك أفريقيا (Bank of Africa - BMCE)',
  'القرض العقاري والسياحي (CIH Bank)',
  'البريد بنك (Al Barid Bank)',
  'الشركة العامة المغرب (Société Générale)',
  'القرض الفلاحي للمغرب (Crédit Agricole)',
  'مصرف المغرب (Crédit du Maroc)',
  'بنك الصفاء (Bank Assafa)',
  'أمنية بنك (Umnia Bank)',
  'بنك آخر...',
];

export const AddCommercialPaperModal: React.FC<AddCommercialPaperModalProps> = ({
  paperToEdit,
  defaultCustomerId,
  defaultType = 'cheque',
  defaultDirection = 'in',
  onClose,
}) => {
  const { customers, userProfile, addCommercialPaper, updateCommercialPaper, config } =
    useCreditManager();

  const isEditing = Boolean(paperToEdit);

  // Core Form states
  const [type, setType] = useState<CommercialPaperType>(paperToEdit?.type || defaultType);
  const [direction, setDirection] = useState<CommercialPaperDirection>(
    paperToEdit?.direction || defaultDirection
  );
  const [amount, setAmount] = useState<string>(paperToEdit ? String(paperToEdit.amount) : '');
  const [number, setNumber] = useState<string>(paperToEdit?.number || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    paperToEdit?.customerId || defaultCustomerId || ''
  );
  const [drawer, setDrawer] = useState<string>(paperToEdit?.drawer || '');
  const [bankName, setBankName] = useState<string>(
    paperToEdit?.bankName || MOROCCAN_BANKS[0]
  );
  const [customBank, setCustomBank] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    paperToEdit?.dueDate ||
      new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  // Optional extra fields
  const [showExtras, setShowExtras] = useState<boolean>(
    Boolean(paperToEdit?.notes || paperToEdit?.frontPhotoUrl || paperToEdit?.direction === 'out')
  );
  const [notes, setNotes] = useState<string>(paperToEdit?.notes || '');
  const [frontPhotoUrl, setFrontPhotoUrl] = useState<string>(paperToEdit?.frontPhotoUrl || '');
  const [status, setStatus] = useState<CommercialPaperStatus>(paperToEdit?.status || 'safe');

  // Customer selection auto-fill
  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setDrawer(cust.name);
    }
  };

  // Quick date shortcuts
  const setQuickDueDate = (days: number) => {
    const target = new Date(Date.now() + days * 86400000);
    setDueDate(target.toISOString().split('T')[0]);
  };

  // Photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const effectiveBank =
    bankName === 'بنك آخر...' && customBank.trim() ? customBank.trim() : bankName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }

    if (!number.trim()) {
      return;
    }

    const effectiveDrawer = drawer.trim() || (selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId)?.name : '') || 'زبون عام';
    const effectiveBeneficiary = direction === 'in' ? userProfile.businessName || 'المتجر' : effectiveDrawer;

    if (isEditing && paperToEdit) {
      await updateCommercialPaper(paperToEdit.id, {
        number: number.trim(),
        type,
        direction,
        amount: numericAmount,
        dueDate,
        bankName: effectiveBank,
        drawer: effectiveDrawer,
        customerId: selectedCustomerId || undefined,
        beneficiary: effectiveBeneficiary,
        status,
        notes: notes.trim(),
        frontPhotoUrl: frontPhotoUrl || undefined,
      });
    } else {
      await addCommercialPaper({
        number: number.trim(),
        type,
        direction,
        amount: numericAmount,
        dueDate,
        issueDate: new Date().toISOString().split('T')[0],
        bankName: effectiveBank,
        drawer: effectiveDrawer,
        customerId: selectedCustomerId || undefined,
        beneficiary: effectiveBeneficiary,
        status,
        notes: notes.trim(),
        frontPhotoUrl: frontPhotoUrl || undefined,
      });
    }

    onClose();
  };

  // Calculate days diff preview
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Simple & Clean Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isEditing ? 'تعديل السند البنكي' : 'تسجيل شيك أو كمبيالة جديدة'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أدخل المعلومات الأساسية لتتبع موعد الصرف والتنبيهات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Clean Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-start">
          {/* 1. Type Switcher: Chèque vs Traite */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('cheque')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'cheque'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>شيك بنكي (Chèque)</span>
            </button>
            <button
              type="button"
              onClick={() => setType('traite')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                type === 'traite'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>كمبيالة (لاطريت)</span>
            </button>
          </div>

          {/* 2. Amount Input (Prominent & Clear) */}
          <div>
            <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
              المبلغ بالدرهم ({config.currency}) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={amount}
                onFocus={(e) => {
                  e.currentTarget.select();
                  if (amount === '0') setAmount('');
                }}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full ps-4 pe-14 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-2xl text-lg font-black font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <span className="absolute inset-y-0 end-4 my-auto flex items-center text-xs font-black text-slate-400 pointer-events-none">
                {config.currency}
              </span>
            </div>
          </div>

          {/* 3. Customer / Drawer Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              الزبون أو صاحب الشيك *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Dropdown list of customers */}
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
              >
                <option value="">-- اختر من قائمة الزبائن --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>

              {/* Or manual drawer name */}
              <input
                type="text"
                required
                value={drawer}
                onChange={(e) => setDrawer(e.target.value)}
                placeholder="أو اكتب اسم الشخص هنا..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
              />
            </div>
          </div>

          {/* 4. Number & Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                رقم {type === 'cheque' ? 'الشيك' : 'الكمبيالة'} *
              </label>
              <input
                type="text"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="مثال: 7481920"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold font-mono dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                البنك (Banque) *
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
              >
                {MOROCCAN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {bankName === 'بنك آخر...' && (
                <input
                  type="text"
                  required
                  value={customBank}
                  onChange={(e) => setCustomBank(e.target.value)}
                  placeholder="اسم البنك..."
                  className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                />
              )}
            </div>
          </div>

          {/* 5. Due Date (موعد الصرف) with quick chips */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>تاريخ الصرف (موعد الدفع في البنك) *</span>
              </label>
              {dueDate && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    diffDays < 0
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : diffDays === 0
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {diffDays < 0
                    ? `فات موعده بـ ${Math.abs(diffDays)} يوم`
                    : diffDays === 0
                    ? 'اليوم موعد الصرف!'
                    : `متبقي ${diffDays} يوم`}
                </span>
              )}
            </div>

            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
            />

            {/* Quick date chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
              <span className="text-slate-400">تحديد سريع:</span>
              {[
                { label: 'اليوم', days: 0 },
                { label: 'أسبوع', days: 7 },
                { label: '15 يوماً', days: 15 },
                { label: 'شهر (30 يوم)', days: 30 },
                { label: 'شهران (60 يوم)', days: 60 },
              ].map((item) => (
                <button
                  key={item.days}
                  type="button"
                  onClick={() => setQuickDueDate(item.days)}
                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Expandable Optional Extras (Notes, Direction, Photo) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowExtras(!showExtras)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showExtras ? 'إخفاء الخيارات الإضافية' : '+ خيارات إضافية (ملاحظة، صورة الشيك، الاتجاه)'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExtras ? 'rotate-180' : ''}`} />
            </button>

            {showExtras && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3 text-xs animate-in fade-in duration-150">
                {/* In or Out direction */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اتجاه السند:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDirection('in')}
                      className={`py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer ${
                        direction === 'in'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>مقبوض من زبون</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('out')}
                      className={`py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer ${
                        direction === 'out'
                          ? 'bg-rose-600 text-white'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>صادر لمورد</span>
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات (اختياري):
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: تسديد دفعة طلبيات السلع..."
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>

                {/* Photo attachment */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    صورة الشيك (اختياري):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-100">
                      <Camera className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold">إرفاق صورة</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {frontPhotoUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={frontPhotoUrl}
                          alt="Cheque preview"
                          className="w-10 h-8 object-cover rounded-lg border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => setFrontPhotoUrl('')}
                          className="text-rose-500 hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Submit & Cancel buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'حفظ التعديلات' : `تسجيل ${type === 'cheque' ? 'الشيك' : 'الكمبيالة'}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
