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
  Building,
  AlertCircle,
  Sparkles,
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

const SUPPLIER_SUGGESTIONS = [
  'مورد بضاعة وسلع',
  'شركة التوزيع والشحن',
  'إيجار المحل أو المستودع',
  'مصاريف نقل ولوجستيك',
  'فاتورة كهرباء وماء ومصاريف',
  'معدات وتجهيزات',
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

  // Core Form states: Direction is primary
  const [direction, setDirection] = useState<CommercialPaperDirection>(
    paperToEdit?.direction || defaultDirection
  );
  const [type, setType] = useState<CommercialPaperType>(paperToEdit?.type || defaultType);
  const [amount, setAmount] = useState<string>(paperToEdit ? String(paperToEdit.amount) : '');
  const [number, setNumber] = useState<string>(paperToEdit?.number || '');

  // For 'in' (وارد لي ليا): customer is drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    paperToEdit?.customerId || defaultCustomerId || ''
  );
  const [drawer, setDrawer] = useState<string>(paperToEdit?.drawer || '');

  // For 'out' (صادر لي عليا): supplier / beneficiary
  const [beneficiary, setBeneficiary] = useState<string>(
    paperToEdit?.beneficiary || (paperToEdit?.direction === 'out' ? paperToEdit?.drawer : '') || ''
  );

  const [bankName, setBankName] = useState<string>(
    paperToEdit?.bankName || MOROCCAN_BANKS[0]
  );
  const [customBank, setCustomBank] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    paperToEdit?.dueDate ||
      new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  // Optional extra fields
  const [notes, setNotes] = useState<string>(paperToEdit?.notes || '');
  const [frontPhotoUrl, setFrontPhotoUrl] = useState<string>(paperToEdit?.frontPhotoUrl || '');
  const [status, setStatus] = useState<CommercialPaperStatus>(
    paperToEdit?.status || 'safe'
  );
  const [showExtras, setShowExtras] = useState<boolean>(
    Boolean(paperToEdit?.notes || paperToEdit?.frontPhotoUrl)
  );

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

    // Determine drawer and beneficiary based on direction
    let finalDrawer = '';
    let finalBeneficiary = '';

    if (direction === 'in') {
      // شيك لي ليا: الساحب هو الزبون، والمستفيد هو أنا
      finalDrawer = drawer.trim() || (selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId)?.name : '') || 'زبون عام';
      finalBeneficiary = userProfile.businessName || 'المتجر';
    } else {
      // شيك لي عليا: الساحب هو أنا، والمستفيد هو المورد
      finalDrawer = userProfile.businessName || 'المتجر';
      finalBeneficiary = beneficiary.trim() || 'مورد عام';
    }

    if (isEditing && paperToEdit) {
      await updateCommercialPaper(paperToEdit.id, {
        number: number.trim(),
        type,
        direction,
        amount: numericAmount,
        dueDate,
        bankName: effectiveBank,
        drawer: finalDrawer,
        customerId: direction === 'in' ? selectedCustomerId || undefined : undefined,
        beneficiary: finalBeneficiary,
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
        drawer: finalDrawer,
        customerId: direction === 'in' ? selectedCustomerId || undefined : undefined,
        beneficiary: finalBeneficiary,
        status,
        notes: notes.trim(),
        frontPhotoUrl: frontPhotoUrl || undefined,
      });
    }

    onClose();
  };

  // Due calculation for chip
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                direction === 'in'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
              }`}
            >
              {direction === 'in' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isEditing
                  ? 'تعديل بيانات السند البنكي'
                  : direction === 'in'
                  ? 'تسجيل شيك أو كمبيالة (لي ليا / مقبوض)'
                  : 'تسجيل شيك أو كمبيالة (لي عليا / صادر لمورد)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {direction === 'in'
                  ? 'شيك استلمته من زبون وسيدخل في حسابك البنكي'
                  : 'شيك حررته وأعطيته لمورد وسيُخصم من حسابك البنكي'}
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

        {/* The Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-start">
          {/* STEP 1: Main Direction Picker (لي ليا VS لي عليا) - Very Prominent */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
              نوع المعاملة (واش الشيك لي ليا ولا لي عليا؟) *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: لي ليا */}
              <button
                type="button"
                onClick={() => setDirection('in')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-start text-start cursor-pointer ${
                  direction === 'in'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      direction === 'in'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black">شيك لي ليا (مقبوض)</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  زبون عطاني شيك باش نقبضو وندخلو لحسابي
                </p>
              </button>

              {/* Option 2: لي عليا */}
              <button
                type="button"
                onClick={() => setDirection('out')}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-start text-start cursor-pointer ${
                  direction === 'out'
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      direction === 'out'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black">شيك لي عليا (صادر)</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  شيك حررتو لمورد باش يتقتطع من حسابي
                </p>
              </button>
            </div>
          </div>

          {/* STEP 2: Paper Type (شيك بنكي Chèque VS كمبيالة لاطريت Traite) */}
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
              <span>كمبيالة (لاطريت Traite)</span>
            </button>
          </div>

          {/* STEP 3: Amount Input */}
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

          {/* STEP 4: Party Name (Dynamic based on In vs Out) */}
          {direction === 'in' ? (
            <div className="space-y-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
              <label className="block text-xs font-black text-emerald-900 dark:text-emerald-200">
                الزبون صاحب الشيك (الذي سلّمك الشيك) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Dropdown list of customers */}
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                >
                  <option value="">-- اختر من قائمة الزبائن --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>

                {/* Manual name */}
                <input
                  type="text"
                  required
                  value={drawer}
                  onChange={(e) => setDrawer(e.target.value)}
                  placeholder="أو اكتب اسم الزبون هنا..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                سيتم ربط الشيك بهذا الزبون ويمكنك إرسال تذكير له عند قرب موعد الصرف.
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-rose-50/50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/40">
              <label className="block text-xs font-black text-rose-900 dark:text-rose-200">
                المورد أو المستفيد (الذي حررت له الشيك) *
              </label>
              <input
                type="text"
                required
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                placeholder="مثال: شركة التوزيع الغذائي، مورد المواد..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
              />
              {/* Quick suggestions */}
              <div className="flex items-center gap-1 flex-wrap text-[10px] pt-1">
                <span className="text-slate-400">اقتراحات سريعة:</span>
                {SUPPLIER_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setBeneficiary(item)}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Number & Bank */}
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
                  placeholder="اكتب اسم البنك..."
                  className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white"
                />
              )}
            </div>
          </div>

          {/* STEP 6: Due Date (موعد الصرف أو السحب) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>
                  {direction === 'in'
                    ? 'تاريخ الصرف (موعد صرف الشيك في البنك) *'
                    : 'تاريخ الاستحقاق (موعد سحب الشيك من حسابك) *'}
                </span>
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
                    ? 'اليوم موعد الصرف/السحب!'
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
                { label: 'أسبوع (7 أيام)', days: 7 },
                { label: '15 يوماً', days: 15 },
                { label: 'شهر (30 يوم)', days: 30 },
                { label: 'شهران (60 يوم)', days: 60 },
                { label: '3 أشهر (90 يوم)', days: 90 },
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

          {/* STEP 7: Status Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              حالة السند الحالية:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {direction === 'in' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setStatus('safe')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      status === 'safe'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>في الخزينة (بيدي)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('deposited')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      status === 'deposited'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>مودع بالبنك</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('cashed')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      status === 'cashed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>تم الصرف في الحساب</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStatus('safe')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      status === 'safe'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>معلق لدى المورد</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('cashed')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      status === 'cashed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>تم الخصم من حسابي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('rejected')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                      status === 'rejected'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>مرفوض أو مسترجع</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* STEP 8: Extras (Notes & Photo) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowExtras(!showExtras)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{showExtras ? 'إخفاء الملاحظات والصورة' : '+ إضافة ملاحظات أو صورة الشيك (اختياري)'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExtras ? 'rotate-180' : ''}`} />
            </button>

            {showExtras && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3 text-xs animate-in fade-in duration-150">
                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: تسديد دفعة طلبيات السلع رقم 4..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white"
                  />
                </div>

                {/* Photo attachment */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    صورة الشيك / الكمبيالة:
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                      <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-bold">إرفاق أو تصوير الشيك</span>
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
                          className="w-12 h-9 object-cover rounded-lg border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => setFrontPhotoUrl('')}
                          className="text-rose-500 hover:underline font-bold"
                        >
                          حذف الصورة
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer ${
                direction === 'in'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isEditing
                  ? 'حفظ التعديلات'
                  : direction === 'in'
                  ? 'تسجيل الشيك (لي ليا)'
                  : 'تسجيل الشيك (لي عليا)'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
