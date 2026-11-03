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

  // Navigation & View mode
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'urgent' | 'safe' | 'deposited' | 'cashed' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cheque' | 'traite'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'in' | 'out'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Financial statistics calculation
  const stats = useMemo(() => {
    const safePapers = commercialPapers.filter((p) => p.status === 'safe');
    const depositedPapers = commercialPapers.filter((p) => p.status === 'deposited');
    const cashedPapers = commercialPapers.filter((p) => p.status === 'cashed');

    // Urgent items (overdue or due within reminderDaysBefore)
    const urgentPapers = commercialPapers.filter((p) => {
      const isPending = p.status === 'safe' || p.status === 'deposited';
      if (!isPending) return false;
      const diff = getDaysDiff(p.dueDate);
      return diff <= (config.reminderDaysBefore || 7);
    });

    const safeAmount = safePapers.reduce((sum, p) => sum + p.amount, 0);
    const depositedAmount = depositedPapers.reduce((sum, p) => sum + p.amount, 0);
    const cashedAmount = cashedPapers.reduce((sum, p) => sum + p.amount, 0);
    const urgentAmount = urgentPapers.reduce((sum, p) => sum + p.amount, 0);

    return {
      safeCount: safePapers.length,
      safeAmount,
      depositedCount: depositedPapers.length,
      depositedAmount,
      urgentCount: urgentPapers.length,
      urgentAmount,
      cashedCount: cashedPapers.length,
      cashedAmount,
      totalCount: commercialPapers.length,
      totalAmount: commercialPapers.reduce((sum, p) => sum + p.amount, 0),
    };
  }, [commercialPapers, config.reminderDaysBefore, today]);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return commercialPapers.filter((paper) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = paper.number.toLowerCase().includes(q);
        const matchBank = paper.bankName.toLowerCase().includes(q);
        const matchDrawer = paper.drawer.toLowerCase().includes(q);
        const matchAmt = String(paper.amount).includes(q);
        if (!matchNum && !matchBank && !matchDrawer && !matchAmt) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && paper.type !== typeFilter) return false;

      // Direction filter
      if (directionFilter !== 'all' && paper.direction !== directionFilter) return false;

      // Status Filter
      if (statusFilter === 'urgent') {
        const isPending = paper.status === 'safe' || paper.status === 'deposited';
        const diff = getDaysDiff(paper.dueDate);
        return isPending && diff <= (config.reminderDaysBefore || 7);
      }
      if (statusFilter !== 'all' && paper.status !== statusFilter) return false;

      return true;
    });
  }, [commercialPapers, searchQuery, typeFilter, directionFilter, statusFilter, config.reminderDaysBefore, today]);

  // Grouped papers for timeline view
  const timelineGroups = useMemo(() => {
    const overdue: CommercialPaper[] = [];
    const todayDue: CommercialPaper[] = [];
    const thisWeek: CommercialPaper[] = [];
    const future: CommercialPaper[] = [];
    const cashedOrDone: CommercialPaper[] = [];

    filteredPapers.forEach((paper) => {
      if (paper.status === 'cashed' || paper.status === 'cancelled') {
        cashedOrDone.push(paper);
        return;
      }
      const diff = getDaysDiff(paper.dueDate);
      if (diff < 0) {
        overdue.push(paper);
      } else if (diff === 0) {
        todayDue.push(paper);
      } else if (diff <= 7) {
        thisWeek.push(paper);
      } else {
        future.push(paper);
      }
    });

    return { overdue, todayDue, thisWeek, future, cashedOrDone };
  }, [filteredPapers, today]);

  // Actions
  const handleOpenAdd = (type: CommercialPaperType = 'cheque') => {
    setPaperToEdit(null);
    setDefaultAddType(type);
    setDefaultAddDirection('in');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (paper: CommercialPaper) => {
    setPaperToEdit(paper);
    setIsAddModalOpen(true);
  };

  const handleOpenStatusModal = (paper: CommercialPaper, initialTarget: CommercialPaperStatus = 'cashed') => {
    setStatusModalPaper(paper);
    setTargetStatus(initialTarget);
    setStatusDate(new Date().toISOString().split('T')[0]);
    setStatusNotes('');
    setAutoRecordPayment(false);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalPaper) return;
    await changePaperStatus(statusModalPaper.id, targetStatus, {
      depositDate: targetStatus === 'deposited' ? statusDate : undefined,
      cashedDate: targetStatus === 'cashed' ? statusDate : undefined,
      notes: statusNotes.trim() || undefined,
      autoRecordPayment: targetStatus === 'cashed' ? autoRecordPayment : false,
    });
    setStatusModalPaper(null);
  };

  const handleSendWhatsApp = (paper: CommercialPaper) => {
    const cust = customers.find((c) => c.id === paper.customerId);
    const targetPhone = cust?.phone;
    const paperName = paper.type === 'cheque' ? 'الشيك' : 'الكمبيالة (لاطريت)';
    const amountStr = formatCurrency(paper.amount, config.currency, config.language);

    const message = `السلام عليكم ${paper.drawer}، تذكير بموعد صرف ${paperName} رقم ${paper.number} بمبلغ ${amountStr} في تاريخ ${formatDate(paper.dueDate, config.language)}. المرجو التأكد من توفر الرصيد في الحساب البنكي. شكراً جزيلاً.`;

    if (targetPhone) {
      window.open(getWhatsAppUrl(targetPhone, message), '_blank');
    } else {
      navigator.clipboard.writeText(message);
      alert('تم نسخ نص رسالة التذكير بنجاح! يمكنك إرسالها للزبون عبر واتساب.');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Executive Top Bar (Matches DebtList & CustomerList styling) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/80 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                دفتر الشيكات والكمبيالات (Carnet des Chèques & Traites)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {filteredPapers.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              سجل تتبع الشيكات ولاطريط، مواعيد استحقاقها وعمليات الصرف في البنك
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleOpenAdd('cheque')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل شيك</span>
          </button>
          <button
            onClick={() => handleOpenAdd('traite')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل كمبيالة (لاطريت)</span>
          </button>
        </div>
      </div>

      {/* 2. Four Clean Financial Indicator Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* In Safe (Portfolio) */}
        <div
          onClick={() => setStatusFilter('safe')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'safe'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-indigo-500" />
              <span>في الخزينة</span>
            </span>
            <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              {stats.safeCount}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(stats.safeAmount, config.currency, config.language)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">شيكات بيدك لم تدفع للبنك بعد</p>
        </div>

        {/* Deposited in Bank */}
        <div
          onClick={() => setStatusFilter('deposited')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'deposited'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-500" />
              <span>مودعة بالبنك</span>
            </span>
            <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              {stats.depositedCount}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
            {formatCurrency(stats.depositedAmount, config.currency, config.language)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">دفعتها للبنك في انتظار المقاصة</p>
        </div>

        {/* Urgent (Due soon or overdue) */}
        <div
          onClick={() => setStatusFilter('urgent')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'urgent'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm bg-rose-50/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>قريبة أو متأخرة</span>
            </span>
            <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              {stats.urgentCount}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
            {formatCurrency(stats.urgentAmount, config.currency, config.language)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">حان وقت صرفها أو اقترب</p>
        </div>

        {/* Cashed */}
        <div
          onClick={() => setStatusFilter('cashed')}
          className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'cashed'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>تم الصرف في الحساب</span>
            </span>
            <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              {stats.cashedCount}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(stats.cashedAmount, config.currency, config.language)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">أموال دخلت فعلياً إلى حسابك</p>
        </div>
      </div>

      {/* 3. Search and Filtering Bar */}
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الشيك، اسم الزبون، البنك، أو المبلغ..."
            className="w-full ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* Filters and View switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status segmented filters */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              الكل ({stats.totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('urgent')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'urgent'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50'
              }`}
            >
              عاجل ({stats.urgentCount})
            </button>
            <button
              onClick={() => setStatusFilter('safe')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'safe'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              في الخزينة ({stats.safeCount})
            </button>
            <button
              onClick={() => setStatusFilter('deposited')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'deposited'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              مودع بالبنك ({stats.depositedCount})
            </button>
            <button
              onClick={() => setStatusFilter('cashed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'cashed'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              تم الصرف ({stats.cashedCount})
            </button>
          </div>

          {/* Secondary Controls: Type + View Mode */}
          <div className="flex items-center gap-2">
            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white"
            >
              <option value="all">كل الأنواع</option>
              <option value="cheque">شيكات فقط</option>
              <option value="traite">كمبيالات فقط</option>
            </select>

            {/* View switcher: List vs Timeline */}
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

      {/* 4. Content Area: Either List or Timeline */}
      {filteredPapers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Landmark className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-1" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            لا توجد شيكات أو كمبيالات مطابقة
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            يمكنك تسجيل شيك جديد مقبوض من زبون أو صادر لمورد ومتابعة موعد صرفه
          </p>
          <button
            onClick={() => handleOpenAdd('cheque')}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل شيك الآن</span>
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* Unified List View: Clean, structured rows just like DebtList */
        <div className="space-y-3">
          {filteredPapers.map((paper) => {
            const diff = getDaysDiff(paper.dueDate);
            const isPending = paper.status === 'safe' || paper.status === 'deposited';
            const isOverdue = isPending && diff < 0;
            const isDueToday = isPending && diff === 0;
            const isDueSoon = isPending && diff > 0 && diff <= (config.reminderDaysBefore || 7);

            return (
              <div
                key={paper.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
                    : isDueToday
                    ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/10'
                    : isDueSoon
                    ? 'border-amber-200 dark:border-amber-900/40'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Right side: Icon, Details, Drawer, Bank */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      paper.type === 'cheque'
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                        : 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    <Landmark className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {paper.drawer}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          paper.type === 'cheque'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        }`}
                      >
                        {paper.type === 'cheque' ? 'شيك' : 'كمبيالة (لاطريت)'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        N° {paper.number}
                      </span>
                    </div>

                    {/* Bank and Due date info */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {paper.bankName}
                      </span>
                      <span>•</span>
                      <span>موعد الصرف: {formatDate(paper.dueDate, config.language)}</span>
                      <span>•</span>
                      {paper.status === 'cashed' ? (
                        <span className="text-emerald-600 font-bold">تم الصرف بنجاح ✅</span>
                      ) : isOverdue ? (
                        <span className="text-rose-600 font-black">
                          فات موعده بـ {Math.abs(diff)} يوم ⚠️
                        </span>
                      ) : isDueToday ? (
                        <span className="text-amber-600 font-black animate-pulse">
                          اليوم موعد الصرف! 🔔
                        </span>
                      ) : isDueSoon ? (
                        <span className="text-amber-600 font-bold">
                          باقي {diff} أيام فقط ⏳
                        </span>
                      ) : (
                        <span>باقي {diff} يوم</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Left side: Amount, Status badge, Action buttons */}
                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Amount and Status Pill */}
                  <div className="text-start md:text-end">
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
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
                          ? '✅ تم الصرف'
                          : paper.status === 'deposited'
                          ? '🏦 مودع بالبنك'
                          : paper.status === 'rejected'
                          ? '❌ مرفوض'
                          : '💼 في الخزينة'}
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Quick Deposit button */}
                    {paper.status === 'safe' && (
                      <button
                        onClick={() => handleOpenStatusModal(paper, 'deposited')}
                        className="px-2.5 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-all cursor-pointer"
                        title="إيداع بالبنك"
                      >
                        إيداع
                      </button>
                    )}

                    {/* Quick Cash button */}
                    {paper.status !== 'cashed' && (
                      <button
                        onClick={() => handleOpenStatusModal(paper, 'cashed')}
                        className="px-3 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>صرف</span>
                      </button>
                    )}

                    {/* WhatsApp Reminder */}
                    <button
                      onClick={() => handleSendWhatsApp(paper)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-all cursor-pointer"
                      title="إرسال تذكير واتساب"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(paper)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                      title="تعديل"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setPaperToDelete(paper)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-all cursor-pointer"
                      title="حذف"
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
        /* Timeline Agenda View: Grouped by urgency so user knows exactly what's next */
        <div className="space-y-6">
          {/* 1. Overdue Section */}
          {timelineGroups.overdue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                <span>متأخرة عن موعدها ({timelineGroups.overdue.length})</span>
              </div>
              <div className="space-y-2">
                {timelineGroups.overdue.map((p) => (
                  <TimelinePaperRow
                    key={p.id}
                    paper={p}
                    config={config}
                    onCash={() => handleOpenStatusModal(p, 'cashed')}
                    onDeposit={() => handleOpenStatusModal(p, 'deposited')}
                    onWhatsApp={() => handleSendWhatsApp(p)}
                    onEdit={() => handleOpenEdit(p)}
                    onDelete={() => setPaperToDelete(p)}
                    diff={getDaysDiff(p.dueDate)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. Due Today */}
          {timelineGroups.todayDue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-amber-600">
                <Clock className="w-4 h-4" />
                <span>موعد صرفها اليوم ({timelineGroups.todayDue.length})</span>
              </div>
              <div className="space-y-2">
                {timelineGroups.todayDue.map((p) => (
                  <TimelinePaperRow
                    key={p.id}
                    paper={p}
                    config={config}
                    onCash={() => handleOpenStatusModal(p, 'cashed')}
                    onDeposit={() => handleOpenStatusModal(p, 'deposited')}
                    onWhatsApp={() => handleSendWhatsApp(p)}
                    onEdit={() => handleOpenEdit(p)}
                    onDelete={() => setPaperToDelete(p)}
                    diff={getDaysDiff(p.dueDate)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 3. Due This Week */}
          {timelineGroups.thisWeek.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-blue-600">
                <Calendar className="w-4 h-4" />
                <span>خلال هذا الأسبوع ({timelineGroups.thisWeek.length})</span>
              </div>
              <div className="space-y-2">
                {timelineGroups.thisWeek.map((p) => (
                  <TimelinePaperRow
                    key={p.id}
                    paper={p}
                    config={config}
                    onCash={() => handleOpenStatusModal(p, 'cashed')}
                    onDeposit={() => handleOpenStatusModal(p, 'deposited')}
                    onWhatsApp={() => handleSendWhatsApp(p)}
                    onEdit={() => handleOpenEdit(p)}
                    onDelete={() => setPaperToDelete(p)}
                    diff={getDaysDiff(p.dueDate)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 4. Future Cheques */}
          {timelineGroups.future.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-400">
                <CalendarDays className="w-4 h-4" />
                <span>مواعيد قادمة لاحقاً ({timelineGroups.future.length})</span>
              </div>
              <div className="space-y-2">
                {timelineGroups.future.map((p) => (
                  <TimelinePaperRow
                    key={p.id}
                    paper={p}
                    config={config}
                    onCash={() => handleOpenStatusModal(p, 'cashed')}
                    onDeposit={() => handleOpenStatusModal(p, 'deposited')}
                    onWhatsApp={() => handleSendWhatsApp(p)}
                    onEdit={() => handleOpenEdit(p)}
                    onDelete={() => setPaperToDelete(p)}
                    diff={getDaysDiff(p.dueDate)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 5. Cashed & Done */}
          {timelineGroups.cashedOrDone.length > 0 && (
            <div className="space-y-3 pt-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم صرفها وخالصة ({timelineGroups.cashedOrDone.length})</span>
              </div>
              <div className="space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                {timelineGroups.cashedOrDone.map((p) => (
                  <TimelinePaperRow
                    key={p.id}
                    paper={p}
                    config={config}
                    onCash={() => handleOpenStatusModal(p, 'cashed')}
                    onDeposit={() => handleOpenStatusModal(p, 'deposited')}
                    onWhatsApp={() => handleSendWhatsApp(p)}
                    onEdit={() => handleOpenEdit(p)}
                    onDelete={() => setPaperToDelete(p)}
                    diff={getDaysDiff(p.dueDate)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Status Update Dialog */}
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
                  اختر الحالة:
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as CommercialPaperStatus)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold dark:text-white"
                >
                  <option value="cashed">✅ تم الصرف في الحساب البنكي (Encaissé)</option>
                  <option value="deposited">🏦 تم الإيداع بالبنك للتحصيل (Déposé)</option>
                  <option value="safe">💼 إعادة إلى الخزينة (En portefeuille)</option>
                  <option value="rejected">❌ شيك مرفوض أو بدون رصيد (Rejeté)</option>
                  <option value="cancelled">🚫 ملغى (Annulé)</option>
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

              {/* Automatic debt payment option if cashed */}
              {targetStatus === 'cashed' && statusModalPaper.direction === 'in' && (
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="autoPayment"
                    checked={autoRecordPayment}
                    onChange={(e) => setAutoRecordPayment(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="autoPayment" className="text-emerald-900 dark:text-emerald-200 font-bold cursor-pointer text-xs leading-relaxed">
                    تسجيل عملية أداء تلقائية وتخفيض دين الزبون بمبلغ (
                    {formatCurrency(statusModalPaper.amount, config.currency, config.language)})
                  </label>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات (اختياري):
                </label>
                <input
                  type="text"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="مثال: تم الإيداع في الحساب البنكي..."
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
                <span className="text-slate-400 font-sans">الساحب:</span>
                <span className="font-bold">{paperToDelete.drawer}</span>
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
  return (
    <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm hover:border-indigo-200 transition-all">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
            paper.type === 'cheque'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
          }`}
        >
          {paper.type === 'cheque' ? 'ش' : 'ك'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">{paper.drawer}</span>
            <span className="font-mono text-slate-400 text-[10px]">N° {paper.number}</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>{paper.bankName}</span>
            <span>•</span>
            <span>{formatDate(paper.dueDate, config.language)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-end font-mono font-bold text-slate-900 dark:text-white">
          {formatCurrency(paper.amount, config.currency, config.language)}
        </div>

        <div className="flex items-center gap-1">
          {paper.status === 'safe' && (
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
              صرف
            </button>
          )}
          <button
            onClick={onWhatsApp}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
            title="واتساب"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
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
