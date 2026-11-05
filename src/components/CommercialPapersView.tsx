import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  CreditCard,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Edit,
  Trash2,
  Phone,
  LayoutGrid,
  List,
  Check,
  Building,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Wallet,
  CalendarDays,
  FileText,
  ChevronDown,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import {
  CommercialPaper,
  CommercialPaperStatus,
  CommercialPaperType,
  CommercialPaperDirection,
} from '../types/creditManager';
import { formatCurrency, formatDate, getWhatsAppUrl } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { AddCommercialPaperModal } from './AddCommercialPaperModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

export const CommercialPapersView: React.FC = () => {
  const {
    commercialPapers,
    customers,
    userProfile,
    config,
    changePaperStatus,
    deleteCommercialPaper,
  } = useCreditManager();
  const t = getTranslation(config.language);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paperToEdit, setPaperToEdit] = useState<CommercialPaper | null>(null);
  const [defaultAddType, setDefaultAddType] = useState<CommercialPaperType>('cheque');
  const [defaultAddDirection, setDefaultAddDirection] = useState<CommercialPaperDirection>('in');

  // Status Change Dialog
  const [statusModalPaper, setStatusModalPaper] = useState<CommercialPaper | null>(null);
  const [targetStatus, setTargetStatus] = useState<CommercialPaperStatus>('cashed');
  const [statusDate, setStatusDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [autoRecordPayment, setAutoRecordPayment] = useState<boolean>(true);

  // Delete modal
  const [paperToDelete, setPaperToDelete] = useState<CommercialPaper | null>(null);

  // 1. PRIMARY DIRECTION TAB: 'in' (لي ليا), 'out' (لي عليا), 'all' (الكل)
  const [directionTab, setDirectionTab] = useState<'in' | 'out' | 'all'>('in');

  // Secondary Filters
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent' | 'safe' | 'deposited' | 'cashed' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cheque' | 'traite'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  // Today reference
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Day difference helper
  const getDaysDiff = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Comprehensive Financial Statistics
  const stats = useMemo(() => {
    // 1. "لي ليا" (مقبوض من زبائن)
    const inPapers = commercialPapers.filter((p) => p.direction === 'in');
    const inPending = inPapers.filter((p) => p.status === 'safe' || p.status === 'deposited');
    const inSafe = inPapers.filter((p) => p.status === 'safe');
    const inDeposited = inPapers.filter((p) => p.status === 'deposited');
    const inCashed = inPapers.filter((p) => p.status === 'cashed');
    const inUrgent = inPapers.filter((p) => {
      if (p.status !== 'safe' && p.status !== 'deposited') return false;
      const diff = getDaysDiff(p.dueDate);
      return diff <= (config.reminderDaysBefore || 7);
    });

    const inTotalAmount = inPapers.reduce((sum, p) => sum + p.amount, 0);
    const inPendingAmount = inPending.reduce((sum, p) => sum + p.amount, 0);
    const inSafeAmount = inSafe.reduce((sum, p) => sum + p.amount, 0);
    const inDepositedAmount = inDeposited.reduce((sum, p) => sum + p.amount, 0);
    const inCashedAmount = inCashed.reduce((sum, p) => sum + p.amount, 0);
    const inUrgentAmount = inUrgent.reduce((sum, p) => sum + p.amount, 0);

    // 2. "لي عليا" (صادر لموردين)
    const outPapers = commercialPapers.filter((p) => p.direction === 'out');
    const outPending = outPapers.filter((p) => p.status === 'safe' || p.status === 'deposited');
    const outCashed = outPapers.filter((p) => p.status === 'cashed');
    const outUrgent = outPapers.filter((p) => {
      if (p.status !== 'safe' && p.status !== 'deposited') return false;
      const diff = getDaysDiff(p.dueDate);
      return diff <= (config.reminderDaysBefore || 7);
    });

    const outTotalAmount = outPapers.reduce((sum, p) => sum + p.amount, 0);
    const outPendingAmount = outPending.reduce((sum, p) => sum + p.amount, 0);
    const outCashedAmount = outCashed.reduce((sum, p) => sum + p.amount, 0);
    const outUrgentAmount = outUrgent.reduce((sum, p) => sum + p.amount, 0);

    return {
      // IN (لي ليا)
      inCount: inPapers.length,
      inTotalAmount,
      inPendingCount: inPending.length,
      inPendingAmount,
      inSafeCount: inSafe.length,
      inSafeAmount,
      inDepositedCount: inDeposited.length,
      inDepositedAmount,
      inCashedCount: inCashed.length,
      inCashedAmount,
      inUrgentCount: inUrgent.length,
      inUrgentAmount,

      // OUT (لي عليا)
      outCount: outPapers.length,
      outTotalAmount,
      outPendingCount: outPending.length,
      outPendingAmount,
      outCashedCount: outCashed.length,
      outCashedAmount,
      outUrgentCount: outUrgent.length,
      outUrgentAmount,

      // General
      totalCount: commercialPapers.length,
      totalAmount: commercialPapers.reduce((sum, p) => sum + p.amount, 0),
    };
  }, [commercialPapers, config.reminderDaysBefore, today]);

  // Filtered Papers based on selected Direction Tab and secondary filters
  const filteredPapers = useMemo(() => {
    return commercialPapers.filter((paper) => {
      // 1. Primary Direction Filter
      if (directionTab !== 'all' && paper.direction !== directionTab) {
        return false;
      }

      // 2. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = paper.number.toLowerCase().includes(q);
        const matchBank = paper.bankName.toLowerCase().includes(q);
        const matchDrawer = paper.drawer?.toLowerCase().includes(q) || false;
        const matchBeneficiary = paper.beneficiary?.toLowerCase().includes(q) || false;
        const matchNotes = paper.notes?.toLowerCase().includes(q) || false;
        const matchAmt = String(paper.amount).includes(q);
        if (!matchNum && !matchBank && !matchDrawer && !matchBeneficiary && !matchNotes && !matchAmt) {
          return false;
        }
      }

      // 3. Type Filter
      if (typeFilter !== 'all' && paper.type !== typeFilter) return false;

      // 4. Status Filter
      if (statusFilter === 'urgent') {
        const isPending = paper.status === 'safe' || paper.status === 'deposited';
        const diff = getDaysDiff(paper.dueDate);
        return isPending && diff <= (config.reminderDaysBefore || 7);
      }
      if (statusFilter !== 'all' && paper.status !== statusFilter) return false;

      return true;
    });
  }, [commercialPapers, directionTab, searchQuery, typeFilter, statusFilter, config.reminderDaysBefore, today]);

  // Handlers for Add Modal
  const handleOpenAddIn = (type: CommercialPaperType = 'cheque') => {
    setPaperToEdit(null);
    setDefaultAddType(type);
    setDefaultAddDirection('in');
    setIsAddModalOpen(true);
  };

  const handleOpenAddOut = (type: CommercialPaperType = 'cheque') => {
    setPaperToEdit(null);
    setDefaultAddType(type);
    setDefaultAddDirection('out');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (paper: CommercialPaper) => {
    setPaperToEdit(paper);
    setIsAddModalOpen(true);
  };

  const handleOpenStatusModal = (
    paper: CommercialPaper,
    initialTarget: CommercialPaperStatus = 'cashed'
  ) => {
    setStatusModalPaper(paper);
    setTargetStatus(initialTarget);
    setStatusDate(new Date().toISOString().split('T')[0]);
    setStatusNotes('');
    setAutoRecordPayment(paper.direction === 'in');
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalPaper) return;
    await changePaperStatus(statusModalPaper.id, targetStatus, {
      cashedDate: targetStatus === 'cashed' ? statusDate : undefined,
      depositDate: targetStatus === 'deposited' ? statusDate : undefined,
      notes: statusNotes,
      autoRecordPayment: targetStatus === 'cashed' ? autoRecordPayment : false,
    });
    setStatusModalPaper(null);
  };

  // WhatsApp reminder for 'in' papers
  const handleSendWhatsApp = (paper: CommercialPaper) => {
    let targetPhone = '';
    if (paper.customerId) {
      const cust = customers.find((c) => c.id === paper.customerId);
      if (cust) targetPhone = cust.phone;
    }

    const diff = getDaysDiff(paper.dueDate);
    const formattedAmt = formatCurrency(paper.amount, config.currency, config.language);

    const message = `السلام عليكم ورحمة الله وبركاته 🌹
أخي الكريم / أختي الكريمة: *${paper.drawer}*
تحية طيبة من *${userProfile.businessName || 'متجرنا'}* ✨

نود تذكيركم بموعد صرف ${paper.type === 'cheque' ? 'الشيك البنكي' : 'الكمبيالة (لاطريت)'}:
📄 رقم السند: *${paper.number}*
🏦 البنك: *${paper.bankName}*
💰 المبلغ: *${formattedAmt}*
📅 تاريخ الصرف المتفق عليه: *${formatDate(paper.dueDate, config.language)}* ${
      diff === 0
        ? '*(اليوم)*'
        : diff < 0
        ? `*(متأخر بـ ${Math.abs(diff)} يوم)*`
        : `*(باقي ${diff} أيام)*`
    }

نرجو التأكد من توفر الرصيد الكافي بالحساب لتيسير عملية الصرف في أفضل الظروف.
جزاكم الله خيراً وبارك الله في تجارتكم 🤲`;

    if (targetPhone) {
      window.open(getWhatsAppUrl(targetPhone, message), '_blank');
    } else {
      navigator.clipboard.writeText(message);
      alert('تم نسخ نص رسالة التذكير بنجاح! يمكنك إرسالها للزبون عبر واتساب.');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Header Bar with Direct "لي ليا" and "لي عليا" Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/80 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                دفتر الشيكات والكمبيالات (Chèques & Traites)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredPapers.length} سند
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تتبع الشيكات التي ستقبضها من الزبائن (لي ليا) والشيكات الصادرة من دفتك للموردين (لي عليا)
            </p>
          </div>
        </div>

        {/* Action Buttons: 2 Clear Buttons for In vs Out */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            onClick={() => handleOpenAddIn('cheque')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-all active:scale-95 cursor-pointer"
            title="تسجيل شيك استلمته من زبون لتسوية حسابه"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ شيك لي ليا (مقبوض)</span>
          </button>

          <button
            onClick={() => handleOpenAddOut('cheque')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow transition-all active:scale-95 cursor-pointer"
            title="تسجيل شيك حررته وسلمته لمورد سلعة أو مصاريف"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ شيك لي عليا (صادر)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="كيف يعمل دفتر الشيكات؟"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide Banner for User Clarity */}
      {showGuide && (
        <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-100 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-black text-sm">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>دليل مبسط: الفرق بين الشيكات لي ليا والشيكات لي عليا</span>
            </span>
            <button
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
                <ArrowDownLeft className="w-4 h-4" />
                <span>1. شيكات وكمبيالات لي ليا (Chèques Reçus):</span>
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                شيكات أو طريطات عطاهم ليك الكليان كخلاص. التطبيق كيحسب ليك المبالغ لي باقية بيدك، والمبالغ لي دفعتيها للبنكة، وكيصيفط ليك تنبيه قبل ما يوصل تاريخ الصرف باش تدفع الشيك ويدخل لحسابك.
              </p>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-800">
              <span className="font-black text-rose-700 dark:text-rose-400 flex items-center gap-1 mb-1">
                <ArrowUpRight className="w-4 h-4" />
                <span>2. شيكات وكمبيالات لي عليا (Chèques Émis):</span>
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                شيكات خرجتيهم من دفتر الشيكات ديالك وعطيتيهم لموردين سلع (Fournisseurs) أو مصاريف. التطبيق كيحسب مجموع المبالغ لي خاصك توفرها فالبنكة، وكيعلمك قبل ميعاد السحب باش تحط الفلوس وما يرجعش الشيك.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. THE BIG PRIMARY SWITCHER: "لي ليا" vs "لي عليا" vs "الكل" */}
      <div className="p-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-2xl grid grid-cols-3 gap-1.5 text-center text-xs font-black">
        {/* Tab 1: لي ليا */}
        <button
          type="button"
          onClick={() => {
            setDirectionTab('in');
            setStatusFilter('all');
          }}
          className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            directionTab === 'in'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>شيكات لي ليا (مقبوضة من زبائن)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              directionTab === 'in'
                ? 'bg-white/20 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {stats.inCount}
          </span>
        </button>

        {/* Tab 2: لي عليا */}
        <button
          type="button"
          onClick={() => {
            setDirectionTab('out');
            setStatusFilter('all');
          }}
          className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            directionTab === 'out'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>شيكات لي عليا (صادرة لموردين)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              directionTab === 'out'
                ? 'bg-white/20 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {stats.outCount}
          </span>
        </button>

        {/* Tab 3: الكل */}
        <button
          type="button"
          onClick={() => {
            setDirectionTab('all');
            setStatusFilter('all');
          }}
          className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            directionTab === 'all'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>الكل (السجل الشامل)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              directionTab === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {stats.totalCount}
          </span>
        </button>
      </div>

      {/* 3. DYNAMIC FINANCIAL HIGHLIGHTS ACCORDING TO SELECTED TAB */}
      {directionTab === 'in' ? (
        /* HIGHLIGHTS FOR "لي ليا" (INCOMING) */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Pending to Cash */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>شيكات تنتظر الصرف</span>
              </span>
              <span className="font-black px-2 py-0.5 rounded-full text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                {stats.inPendingCount}
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-950 dark:text-white font-mono">
              {formatCurrency(stats.inPendingAmount, config.currency, config.language)}
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
              مجموع المبالغ التي ستدخل في حسابك
            </p>
          </div>

          {/* In Safe (بيدك) */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'safe' ? 'all' : 'safe')}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
              statusFilter === 'safe'
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-indigo-500" />
                <span>في الخزينة (بيدك)</span>
              </span>
              <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {stats.inSafeCount}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(stats.inSafeAmount, config.currency, config.language)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">شيكات لم تدفع للبنك بعد</p>
          </div>

          {/* Deposited in Bank (مودعة) */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'deposited' ? 'all' : 'deposited')}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
              statusFilter === 'deposited'
                ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-500" />
                <span>مودعة بالبنك</span>
              </span>
              <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                {stats.inDepositedCount}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
              {formatCurrency(stats.inDepositedAmount, config.currency, config.language)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">دفعتها وتنتظر المقاصة</p>
          </div>

          {/* Urgent / Due Soon */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'urgent' ? 'all' : 'urgent')}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
              statusFilter === 'urgent'
                ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm bg-amber-50/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>حان موعد صرفها</span>
              </span>
              <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {stats.inUrgentCount}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatCurrency(stats.inUrgentAmount, config.currency, config.language)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">تاريخ صرفها اليوم أو قريباً</p>
          </div>
        </div>
      ) : directionTab === 'out' ? (
        /* HIGHLIGHTS FOR "لي عليا" (OUTGOING TO SUPPLIERS) */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Pending to be debited */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>شيكات معلقة يجب توفير رصيدها</span>
              </span>
              <span className="font-black px-2 py-0.5 rounded-full text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
                {stats.outPendingCount}
              </span>
            </div>
            <div className="text-lg sm:text-xl font-black text-rose-950 dark:text-white font-mono">
              {formatCurrency(stats.outPendingAmount, config.currency, config.language)}
            </div>
            <p className="text-[10px] text-rose-700 dark:text-rose-400 mt-1 font-medium">
              واجب توفير هذا المبلغ بحسابك البنكي للموردين
            </p>
          </div>

          {/* Urgent / Approaching Due date */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'urgent' ? 'all' : 'urgent')}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
              statusFilter === 'urgent'
                ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm bg-rose-50/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-rose-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>سحب قريب أو متأخر</span>
              </span>
              <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {stats.outUrgentCount}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
              {formatCurrency(stats.outUrgentAmount, config.currency, config.language)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">تأكد من وجود الرصيد الكافي بالبنك</p>
          </div>

          {/* Successfully Debited */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'cashed' ? 'all' : 'cashed')}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer col-span-2 lg:col-span-1 ${
              statusFilter === 'cashed'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>تم الخصم من حسابك</span>
              </span>
              <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                {stats.outCashedCount}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(stats.outCashedAmount, config.currency, config.language)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">شيكات تم اقتطاعها وتسويتها</p>
          </div>
        </div>
      ) : (
        /* HIGHLIGHTS FOR "الكل" (COMBINED) */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
              مجموع الشيكات لي ليا (مقبوضة)
            </span>
            <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 font-mono">
              {formatCurrency(stats.inTotalAmount, config.currency, config.language)}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">{stats.inCount} سند</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block mb-1">
              مجموع الشيكات لي عليا (صادرة)
            </span>
            <div className="text-lg font-black text-rose-900 dark:text-rose-100 font-mono">
              {formatCurrency(stats.outTotalAmount, config.currency, config.language)}
            </div>
            <span className="text-[10px] text-rose-600 font-bold">{stats.outCount} سند</span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
            <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 block mb-1">
              في الخزينة بيدك
            </span>
            <div className="text-lg font-black text-indigo-900 dark:text-indigo-100 font-mono">
              {formatCurrency(stats.inSafeAmount, config.currency, config.language)}
            </div>
            <span className="text-[10px] text-indigo-600 font-bold">{stats.inSafeCount} سند</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 block mb-1">
              مودعة بالبنك
            </span>
            <div className="text-lg font-black text-blue-900 dark:text-blue-100 font-mono">
              {formatCurrency(stats.inDepositedAmount, config.currency, config.language)}
            </div>
            <span className="text-[10px] text-blue-600 font-bold">{stats.inDepositedCount} سند</span>
          </div>
        </div>
      )}

      {/* 4. Search and Status Filtering Bar */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              directionTab === 'in'
                ? 'ابحث برقم الشيك، اسم الزبون، البنك، أو المبلغ...'
                : directionTab === 'out'
                ? 'ابحث برقم الشيك، اسم المورد/المستفيد، البنك، أو المبلغ...'
                : 'ابحث برقم الشيك، الاسم، البنك، أو المبلغ...'
            }
            className="w-full ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* Filter chips & Secondary Switchers */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status filter chips */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              الكل ({filteredPapers.length})
            </button>
            <button
              onClick={() => setStatusFilter('urgent')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'urgent'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50'
              }`}
            >
              عاجل ({directionTab === 'out' ? stats.outUrgentCount : stats.inUrgentCount})
            </button>
            {directionTab === 'in' && (
              <>
                <button
                  onClick={() => setStatusFilter('safe')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    statusFilter === 'safe'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  في الخزينة ({stats.inSafeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('deposited')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    statusFilter === 'deposited'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  مودع بالبنك ({stats.inDepositedCount})
                </button>
              </>
            )}
            <button
              onClick={() => setStatusFilter('cashed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'cashed'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {directionTab === 'out' ? 'تم الخصم' : 'تم الصرف'} (
              {directionTab === 'out' ? stats.outCashedCount : stats.inCashedCount})
            </button>
          </div>

          {/* Type filter & View Mode */}
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white"
            >
              <option value="all">كل الأنواع (شيكات ولاطريط)</option>
              <option value="cheque">شيكات فقط</option>
              <option value="traite">كمبيالات (لاطريت) فقط</option>
            </select>

            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>قائمة</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>أجندة المواعيد</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. CONTENT: List vs Timeline */}
      {filteredPapers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Landmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-1" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {directionTab === 'in'
              ? 'لا توجد شيكات أو كمبيالات (لي ليا) مسجلة حالياً'
              : directionTab === 'out'
              ? 'لا توجد شيكات أو كمبيالات (لي عليا) مسجلة حالياً'
              : 'لا توجد شيكات أو كمبيالات مطابقة للبحث'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {directionTab === 'in'
              ? 'يمكنك تسجيل شيك أو كمبيالة جديدة استلمتها من زبون لتتبع تاريخ استحقاقها وصرفها'
              : 'يمكنك تسجيل شيك صادر من دفترك لمورد لمتابعة توفير الرصيد قبل موعد سحبه'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            {directionTab === 'out' ? (
              <button
                onClick={() => handleOpenAddOut('cheque')}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>تسجيل شيك لي عليا الآن</span>
              </button>
            ) : (
              <button
                onClick={() => handleOpenAddIn('cheque')}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>تسجيل شيك لي ليا الآن</span>
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* Unified List View */
        <div className="space-y-3">
          {filteredPapers.map((paper) => {
            const diff = getDaysDiff(paper.dueDate);
            const isPending = paper.status === 'safe' || paper.status === 'deposited';
            const isOverdue = isPending && diff < 0;
            const isDueToday = isPending && diff === 0;
            const isDueSoon = isPending && diff > 0 && diff <= (config.reminderDaysBefore || 7);
            const isIn = paper.direction === 'in';

            return (
              <div
                key={paper.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/15'
                    : isDueToday
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/15'
                    : isDueSoon
                    ? 'border-amber-200 dark:border-amber-900/40'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Right side: Icon, Details, Drawer/Beneficiary, Bank */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIn
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIn ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {isIn ? (
                          <>
                            <span className="text-slate-400 font-normal text-xs">من الزبون: </span>
                            {paper.drawer}
                          </>
                        ) : (
                          <>
                            <span className="text-slate-400 font-normal text-xs">لصالح المورد: </span>
                            {paper.beneficiary || paper.drawer}
                          </>
                        )}
                      </span>

                      {/* Direction Tag */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-0.5 ${
                          isIn
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {isIn ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3" />
                            <span>لي ليا (وارد)</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3" />
                            <span>لي عليا (صادر)</span>
                          </>
                        )}
                      </span>

                      {/* Type Tag */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          paper.type === 'cheque'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {paper.type === 'cheque' ? 'شيك بنكي' : 'كمبيالة (لاطريت)'}
                      </span>

                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        N° {paper.number}
                      </span>
                    </div>

                    {/* Bank & Due Date */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {paper.bankName}
                      </span>
                      <span>•</span>
                      <span>
                        {isIn ? 'تاريخ الصرف:' : 'تاريخ الاستحقاق:'}{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {formatDate(paper.dueDate, config.language)}
                        </strong>
                      </span>
                      <span>•</span>
                      {paper.status === 'cashed' ? (
                        <span className="text-emerald-600 font-bold">
                          {isIn ? 'تم الصرف بحسابك بنجاح ✅' : 'تم الخصم من حسابك بنجاح ✅'}
                        </span>
                      ) : isOverdue ? (
                        <span className="text-rose-600 font-black">
                          فات موعده بـ {Math.abs(diff)} يوم ⚠️
                        </span>
                      ) : isDueToday ? (
                        <span className="text-amber-600 font-black animate-pulse">
                          اليوم موعد الصرف/السحب! 🔔
                        </span>
                      ) : isDueSoon ? (
                        <span className="text-amber-600 font-bold">
                          باقي {diff} أيام فقط ⏳
                        </span>
                      ) : (
                        <span>باقي {diff} يوم</span>
                      )}

                      {paper.notes && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 italic">"{paper.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Left side: Amount, Status Pill, Action Buttons */}
                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Amount and Status Pill */}
                  <div className="text-start md:text-end">
                    <div
                      className={`text-base sm:text-lg font-black font-mono ${
                        isIn
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(paper.amount, config.currency, config.language)}
                    </div>
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          paper.status === 'cashed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : paper.status === 'deposited'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : paper.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {paper.status === 'cashed'
                          ? isIn
                            ? 'تم الصرف في الحساب'
                            : 'تم الخصم من الحساب'
                          : paper.status === 'deposited'
                          ? 'مودع بالبنك'
                          : paper.status === 'safe'
                          ? isIn
                            ? 'في الخزينة'
                            : 'معلق لدى المورد'
                          : paper.status === 'rejected'
                          ? 'مرفوض'
                          : 'ملغى'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Quick Deposit Button (For 'in' in safe) */}
                    {isIn && paper.status === 'safe' && (
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(paper, 'deposited')}
                        className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="تسجيل أنك دفعت هذا الشيك للبنك في انتظار الصرف"
                      >
                        <Building className="w-3.5 h-3.5" />
                        <span>إيداع بالبنك</span>
                      </button>
                    )}

                    {/* Quick Cash Button */}
                    {paper.status !== 'cashed' && (
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(paper, 'cashed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        title={
                          isIn
                            ? 'تأكيد دخول المبلغ إلى حسابك البنكي'
                            : 'تأكيد سحب المبلغ من حسابك البنكي للمورد'
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isIn ? 'تم الصرف' : 'تم الخصم'}</span>
                      </button>
                    )}

                    {/* WhatsApp reminder button for 'in' */}
                    {isIn && (
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(paper)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-all cursor-pointer"
                        title="إرسال تذكير للزبون عبر واتساب"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(paper)}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      title="تعديل السند"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => setPaperToDelete(paper)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      title="حذف السند"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Timeline Agenda View */
        <div className="space-y-4">
          {filteredPapers.map((paper) => {
            const diff = getDaysDiff(paper.dueDate);
            return (
              <TimelinePaperRow
                key={paper.id}
                paper={paper}
                config={config}
                diff={diff}
                onCash={() => handleOpenStatusModal(paper, 'cashed')}
                onDeposit={() => handleOpenStatusModal(paper, 'deposited')}
                onWhatsApp={() => handleSendWhatsApp(paper)}
                onEdit={() => handleOpenEdit(paper)}
                onDelete={() => setPaperToDelete(paper)}
              />
            );
          })}
        </div>
      )}

      {/* 5. Status Change Modal */}
      {statusModalPaper && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    تحديث حالة {statusModalPaper.type === 'cheque' ? 'الشيك' : 'الكمبيالة'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    رقم {statusModalPaper.number} - {statusModalPaper.bankName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatusModalPaper(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اختر الحالة الجديدة:
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as CommercialPaperStatus)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
                >
                  <option value="cashed">
                    {statusModalPaper.direction === 'in'
                      ? '✅ تم الصرف في الحساب البنكي (دخلت الأموال)'
                      : '✅ تم الخصم والسحب من حسابي البنكي للمورد'}
                  </option>
                  {statusModalPaper.direction === 'in' && (
                    <option value="deposited">🏦 تم الإيداع بالبنك للتحصيل (في انتظار المقاصة)</option>
                  )}
                  <option value="safe">
                    {statusModalPaper.direction === 'in'
                      ? '💼 في الخزينة (لم يدفع للبنك بعد)'
                      : '💼 معلق لدى المورد'}
                  </option>
                  <option value="rejected">❌ شيك مرفوض أو بدون رصيد (Rejeté)</option>
                  <option value="cancelled">🚫 ملغى أو مسترجع (Annulé)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاريخ العملية:
                </label>
                <input
                  type="date"
                  value={statusDate}
                  onChange={(e) => setStatusDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
                />
              </div>

              {/* Automatic debt payment option if cashed for IN paper */}
              {targetStatus === 'cashed' && statusModalPaper.direction === 'in' && (
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="autoPayment"
                    checked={autoRecordPayment}
                    onChange={(e) => setAutoRecordPayment(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="autoPayment"
                    className="text-emerald-900 dark:text-emerald-200 font-bold cursor-pointer text-xs leading-relaxed"
                  >
                    تسجيل عملية أداء تلقائية وتخفيض دين الزبون بمبلغ (
                    {formatCurrency(statusModalPaper.amount, config.currency, config.language)})
                  </label>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات:
                </label>
                <input
                  type="text"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="مثال: تم إيداع الشيك في وكالة البنك..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusModalPaper(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all cursor-pointer"
              >
                تأكيد التحديث
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add or Edit Commercial Paper Modal */}
      {isAddModalOpen && (
        <AddCommercialPaperModal
          paperToEdit={paperToEdit}
          defaultType={defaultAddType}
          defaultDirection={defaultAddDirection}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* 7. Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!paperToDelete}
        title={`تأكيد حذف ${paperToDelete?.type === 'cheque' ? 'الشيك' : 'الكمبيالة'}`}
        message="هل أنت متأكد من رغبتك في حذف هذا السند نهائياً؟"
        details={
          paperToDelete ? (
            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">الرقم:</span>
                <span className="font-bold">{paperToDelete.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">
                  {paperToDelete.direction === 'in' ? 'الزبون (الساحب):' : 'المستفيد / المورد:'}
                </span>
                <span className="font-bold">
                  {paperToDelete.direction === 'in'
                    ? paperToDelete.drawer
                    : paperToDelete.beneficiary || paperToDelete.drawer}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">المبلغ:</span>
                <span className="font-bold text-rose-600">
                  {formatCurrency(paperToDelete.amount, config.currency, config.language)}
                </span>
              </div>
            </div>
          ) : undefined
        }
        onConfirm={async () => {
          if (paperToDelete) {
            const id = paperToDelete.id;
            setPaperToDelete(null);
            await deleteCommercialPaper(id);
          }
        }}
        onCancel={() => setPaperToDelete(null)}
      />
    </div>
  );
};

// Sub-component for Timeline View Rows
interface TimelinePaperRowProps {
  paper: CommercialPaper;
  config: any;
  diff: number;
  onCash: () => void;
  onDeposit: () => void;
  onWhatsApp: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TimelinePaperRow: React.FC<TimelinePaperRowProps> = ({
  paper,
  config,
  diff,
  onCash,
  onDeposit,
  onWhatsApp,
  onEdit,
  onDelete,
}) => {
  const isIn = paper.direction === 'in';

  return (
    <div
      className={`p-3.5 bg-white dark:bg-slate-900 border rounded-2xl flex items-center justify-between gap-3 text-xs shadow-sm transition-all ${
        isIn
          ? 'border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400'
          : 'border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
            isIn
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white">
              {isIn ? paper.drawer : paper.beneficiary || paper.drawer}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {isIn ? 'لي ليا' : 'لي عليا'}
            </span>
            <span className="font-mono text-slate-400 text-[10px]">N° {paper.number}</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>{paper.bankName}</span>
            <span>•</span>
            <span>{formatDate(paper.dueDate, config.language)}</span>
            <span>•</span>
            {diff === 0 ? (
              <span className="text-amber-600 font-bold">اليوم موعد الصرف/السحب!</span>
            ) : diff < 0 ? (
              <span className="text-rose-600 font-bold">متأخر بـ {Math.abs(diff)} يوم</span>
            ) : (
              <span>باقي {diff} يوم</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`text-end font-mono font-black text-sm ${
            isIn ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {formatCurrency(paper.amount, config.currency, config.language)}
        </div>

        <div className="flex items-center gap-1">
          {isIn && paper.status === 'safe' && (
            <button
              onClick={onDeposit}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-blue-100 cursor-pointer"
            >
              إيداع
            </button>
          )}
          {paper.status !== 'cashed' && (
            <button
              onClick={onCash}
              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
            >
              {isIn ? 'صرف' : 'خصم'}
            </button>
          )}
          {isIn && (
            <button
              onClick={onWhatsApp}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
              title="واتساب"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            title="تعديل"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
            title="حذف"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
