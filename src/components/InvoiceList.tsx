import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  FileText,
  Printer,
  MessageCircle,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { Invoice } from '../types/creditManager';
import { formatCurrency, formatDate, getWhatsAppUrl } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { InvoiceDetailModal } from './InvoiceDetailModal';

interface InvoiceListProps {
  onOpenCreateInvoice: (customerId?: string) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onOpenCreateInvoice }) => {
  const { invoices, customers, deleteInvoice, config, userProfile, debts } = useCreditManager();
  const t = getTranslation(config.language);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all'); // all, credit, partial, cash
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const customer = customers.find((c) => c.id === inv.customerId);
      const custName = customer?.name.toLowerCase() || '';
      const custPhone = customer?.phone || '';
      const invNum = inv.invoiceNumber.toLowerCase();
      const term = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !term ||
        invNum.includes(term) ||
        custName.includes(term) ||
        custPhone.includes(term) ||
        (inv.notes && inv.notes.toLowerCase().includes(term));

      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'credit' && inv.paymentType === 'credit') ||
        (filterType === 'partial' && inv.paymentType === 'partial') ||
        (filterType === 'cash' && inv.paymentType === 'cash');

      return matchesSearch && matchesFilter;
    });
  }, [invoices, customers, searchQuery, filterType]);

  // Statistics
  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = invoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalRemaining = invoices.reduce((sum, i) => sum + i.remainingAmount, 0);
    const creditInvoicesCount = invoices.filter((i) => i.remainingAmount > 0).length;

    return {
      totalAmount,
      totalPaid,
      totalRemaining,
      creditInvoicesCount,
      totalCount: invoices.length,
    };
  }, [invoices]);

  const handleSendWhatsApp = (inv: Invoice) => {
    const customer = customers.find((c) => c.id === inv.customerId);
    if (!customer?.phone) return;

    const itemsSummary = inv.items
      .map(
        (it, idx) =>
          `▫️ ${idx + 1}. *${it.name}* (${it.quantity} × ${formatCurrency(
            it.unitPrice,
            config.currency,
            config.language
          )}) = *${formatCurrency(it.total, config.currency, config.language)}*`
      )
      .join('\n');

    let paymentStatusText = '';
    if (inv.paymentType === 'cash' || inv.remainingAmount === 0) {
      paymentStatusText = `✅ *حالة الفاتورة:* مدفوعة كاش بالكامل (${formatCurrency(
        inv.totalAmount,
        config.currency,
        config.language
      )})`;
    } else if (inv.paidAmount > 0) {
      paymentStatusText = `🔸 *المسدد مسبقاً (تسبيق):* ${formatCurrency(
        inv.paidAmount,
        config.currency,
        config.language
      )}\n🔴 *المتبقي المضاف لحسابكم:* *${formatCurrency(
        inv.remainingAmount,
        config.currency,
        config.language
      )}*`;
    } else {
      paymentStatusText = `🔴 *المبلغ المضاف لحسابكم (كريدي):* *${formatCurrency(
        inv.totalAmount,
        config.currency,
        config.language
      )}*`;
    }

    const message = `السلام عليكم ورحمة الله وبركاته 🌹
أخي الفاضل / أختي الكريمة: *${customer.name}*
تحية طيبة مباركة من *${userProfile.businessName || 'متجر الأمانة للتجارة'}* ✨

📄 *فاتورة مشتريات رقم #${inv.invoiceNumber}*
📅 التاريخ: ${formatDate(inv.date, config.language)}
${inv.dueDate ? `⏰ موعد السداد: ${formatDate(inv.dueDate, config.language)}\n` : ''}
🛒 *تفاصيل المشتريات:*
${itemsSummary}

💰 *إجمالي الفاتورة:* *${formatCurrency(inv.totalAmount, config.currency, config.language)}*
${paymentStatusText}

نشكركم جزيلاً على ثقتكم الغالية ويسرنا دائماً خدمتكم بأفضل ما لدينا 🌸`;

    const url = getWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank');
  };

  const handleDelete = async (invId: string) => {
    if (
      window.confirm(
        'هل تريد حذف هذه الفاتورة؟ سيتم أيضاً إزالة الدين المرتبط بها من حساب الزبون تلقائياً.'
      )
    ) {
      await deleteInvoice(invId, true);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 sm:gap-2.5">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">سجل الفواتير والمبيعات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
            إصدار الفواتير للزبناء المسجلين مع زيادة الرصيد تلقائياً في دفتر الديون
          </p>
        </div>

        <button
          onClick={() => onOpenCreateInvoice()}
          className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء فاتورة جديدة</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] sm:text-xs font-bold truncate">إجمالي الفواتير</span>
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
            {formatCurrency(stats.totalAmount, config.currency, config.language)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 truncate">{stats.totalCount} فاتورة مصدرة</div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-rose-500 mb-1">
            <span className="text-[11px] sm:text-xs font-bold truncate">المتبقي ديون (كريدي)</span>
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 truncate">
            {formatCurrency(stats.totalRemaining, config.currency, config.language)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 truncate">{stats.creditInvoicesCount} فواتير بذمة الزبناء</div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-emerald-500 mb-1">
            <span className="text-[11px] sm:text-xs font-bold truncate">المحصل نقداً وتسبيقات</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
            {formatCurrency(stats.totalPaid, config.currency, config.language)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 truncate">مدفوعات مؤكدة</div>
        </div>

        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-indigo-500 mb-1">
            <span className="text-[11px] sm:text-xs font-bold truncate">نسبة التحصيل</span>
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 truncate">
            {stats.totalAmount > 0
              ? `${Math.round((stats.totalPaid / stats.totalAmount) * 100)}%`
              : '0%'}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 truncate">من إجمالي المبيعات</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute inset-y-0 my-auto start-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الفاتورة، اسم الزبون، أو رقم الهاتف..."
            className="w-full ps-10 pe-4 py-2 sm:py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0 scrollbar-none">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'credit', label: 'كريدي (على الحساب)' },
            { id: 'partial', label: 'تسبيق + باقي' },
            { id: 'cash', label: 'كاش نقداً' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center shadow-sm">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            لا توجد فواتير مطابقة
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            يمكنك إنشاء فاتورة جديدة للزبائن المسجلين لديك وستتم إضافة الرصيد لحسابهم تلقائياً.
          </p>
          <button
            onClick={() => onOpenCreateInvoice()}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl sm:rounded-2xl shadow transition-all"
          >
            + إنشاء أول فاتورة الآن
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card View (shown on screens < md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredInvoices.map((inv) => {
              const customer = customers.find((c) => c.id === inv.customerId);
              const itemsCount = inv.items.reduce((s, it) => s + it.quantity, 0);

              return (
                <div
                  key={inv.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  {/* Top Bar: Invoice Number & Status & Date */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        #{inv.invoiceNumber}
                      </button>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentType === 'cash'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : inv.paymentType === 'partial'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {inv.paymentType === 'cash'
                          ? 'كاش نقدي'
                          : inv.paymentType === 'partial'
                          ? 'تسبيق + كريدي'
                          : 'على الحساب'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {formatDate(inv.date, config.language)}
                    </span>
                  </div>

                  {/* Customer & Items Details */}
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {customer?.name || 'زبون عام'}
                      </div>
                      {customer?.phone && (
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span dir="ltr">{customer.phone}</span>
                        </div>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{inv.items.length} أصناف</span>
                    </span>
                  </div>

                  {/* Financial Details */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">إجمالي الفاتورة</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatCurrency(inv.totalAmount, config.currency, config.language)}
                      </span>
                    </div>

                    <div className="text-end">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">المتبقي (الكريدي)</span>
                      {inv.remainingAmount > 0 ? (
                        <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                          {formatCurrency(inv.remainingAmount, config.currency, config.language)}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          خالصة بالكامل ✅
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="flex-1 py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض وطباعة</span>
                    </button>

                    {customer?.phone && (
                      <button
                        onClick={() => handleSendWhatsApp(inv)}
                        className="py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                        title="إرسال عبر واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">واتساب</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="حذف الفاتورة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (shown on screens >= md) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 text-start">رقم الفاتورة</th>
                    <th className="p-3.5 text-start">الزبون</th>
                    <th className="p-3.5 text-start">التاريخ</th>
                    <th className="p-3.5 text-start">السلع</th>
                    <th className="p-3.5 text-end">إجمالي الفاتورة</th>
                    <th className="p-3.5 text-end">المتبقي (الكريدي)</th>
                    <th className="p-3.5 text-center">نوع السداد</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredInvoices.map((inv) => {
                    const customer = customers.find((c) => c.id === inv.customerId);
                    const itemsCount = inv.items.reduce((s, it) => s + it.quantity, 0);

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Invoice Number */}
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-indigo-300"
                          >
                            #{inv.invoiceNumber}
                          </button>
                        </td>

                        {/* Customer */}
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-900 dark:text-white">
                            {customer?.name || 'زبون عام'}
                          </div>
                          {customer?.phone && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-indigo-500" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td className="p-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(inv.date, config.language)}
                        </td>

                        {/* Items */}
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                            <ShoppingBag className="w-3 h-3 text-indigo-500" />
                            <span>
                              {inv.items.length} أصناف ({itemsCount} وحدة)
                            </span>
                          </span>
                        </td>

                        {/* Total */}
                        <td className="p-3.5 text-end font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(inv.totalAmount, config.currency, config.language)}
                        </td>

                        {/* Remaining */}
                        <td className="p-3.5 text-end font-extrabold whitespace-nowrap">
                          {inv.remainingAmount > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              {formatCurrency(inv.remainingAmount, config.currency, config.language)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">
                              تم السداد بالكامل
                            </span>
                          )}
                        </td>

                        {/* Payment Type Badge */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              inv.paymentType === 'cash'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : inv.paymentType === 'partial'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {inv.paymentType === 'cash'
                              ? 'كاش نقدي'
                              : inv.paymentType === 'partial'
                              ? 'تسبيق + كريدي'
                              : 'على الحساب'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                              title="عرض الفاتورة / طباعة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {customer?.phone && (
                              <button
                                onClick={() => handleSendWhatsApp(inv)}
                                className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                                title="إرسال الفاتورة عبر واتساب"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="حذف الفاتورة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Invoice Detail Modal Overlay */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
