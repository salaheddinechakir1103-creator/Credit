import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  Phone,
  MessageCircle,
  MoreVertical,
  DollarSign,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate, daysUntil } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { WhatsAppMessageModal, WhatsAppTemplateType } from './WhatsAppMessageModal';
import { Debt, DebtStatus, DebtType, Customer } from '../types/creditManager';

interface DebtListProps {
  onOpenAddDebt: () => void;
  onEditDebt: (debt: Debt) => void;
  onOpenRecordPayment: (debtId: string, customerId?: string) => void;
  onOpenCreateInvoice?: (customerId?: string) => void;
}

export const DebtList: React.FC<DebtListProps> = ({
  onOpenAddDebt,
  onEditDebt,
  onOpenRecordPayment,
  onOpenCreateInvoice,
}) => {
  const { debts, customers, config, searchQuery, setSearchQuery, deleteDebt, setSelectedCustomerId } =
    useCreditManager();
  const t = getTranslation(config.language);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    customer: Customer;
    debtId?: string;
    template?: WhatsAppTemplateType;
  } | null>(null);

  const filteredDebts = debts.filter((d) => {
    const cust = customers.find((c) => c.id === d.customerId);
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch =
      (cust && cust.name.toLowerCase().includes(searchLower)) ||
      (d.category && d.category.toLowerCase().includes(searchLower)) ||
      (d.notes && d.notes.toLowerCase().includes(searchLower)) ||
      d.amount.toString().includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.debts} ({filteredDebts.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              سجل كافة المستحقات والديون المترتبة، التواريخ وحالات الأداء
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCreateInvoice && (
            <button
              onClick={() => onOpenCreateInvoice()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              <span>فاتورة جديدة (زيادة تلقائية)</span>
            </button>
          )}

          <button
            onClick={onOpenAddDebt}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addDebt}</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.allStatuses}
            </button>
            <button
              onClick={() => setStatusFilter('unpaid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'unpaid'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.unpaid}
            </button>
            <button
              onClick={() => setStatusFilter('partial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'partial'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.partial}
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'overdue'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.overdue}
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'paid'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.paid}
            </button>
          </div>

          {/* Type Selector (Lya / Alya) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.allTypes}
            </button>
            <button
              onClick={() => setTypeFilter('lya')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'lya'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.lyaShort}
            </button>
            <button
              onClick={() => setTypeFilter('alya')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'alya'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.alyaShort}
            </button>
          </div>
        </div>
      </div>

      {/* Debt Records Cards / List */}
      {filteredDebts.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
            لا توجد ديون مطابقة
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            جرب تغيير معايير البحث أو أضف دينًا جديدًا
          </p>
          <button
            onClick={onOpenAddDebt}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all"
          >
            {t.addDebt}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDebts.map((debt) => {
            const cust = customers.find((c) => c.id === debt.customerId);
            const daysLeft = daysUntil(debt.dueDate);

            return (
              <div
                key={debt.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left side: Customer info, Type badge, Category, Notes */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      debt.type === 'lya'
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                        : 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {debt.type === 'lya' ? (
                      <ArrowDownLeft className="w-6 h-6" />
                    ) : (
                      <ArrowUpRight className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          debt.type === 'lya'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {debt.type === 'lya' ? t.lyaShort : t.alyaShort}
                      </span>

                      <button
                        onClick={() => cust && setSelectedCustomerId(cust.id)}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-dashed"
                      >
                        {cust?.name || 'زبون غير معروف'}
                      </button>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          debt.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : debt.status === 'overdue'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                            : debt.status === 'partial'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {debt.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                        {debt.status === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                        {debt.status === 'paid'
                          ? t.paid
                          : debt.status === 'overdue'
                          ? t.overdue
                          : debt.status === 'partial'
                          ? t.partial
                          : t.unpaid}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                      {debt.category || 'دين بضاعة / معاملة مالية'}
                    </div>

                    {debt.notes && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                        "{debt.notes}"
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span>تاريخ النشأة: {formatDate(debt.date, config.language)}</span>
                      <span>•</span>
                      <span className={daysLeft < 0 ? 'text-rose-500 font-bold' : ''}>
                        الاستحقاق: {formatDate(debt.dueDate, config.language)}{' '}
                        {daysLeft < 0
                          ? `(متأخر ${Math.abs(daysLeft)} يوم)`
                          : `(متبقي ${daysLeft} يوم)`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side: Amount, Remaining Amount & Action buttons */}
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-800">
                  <div className="text-start md:text-end">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      المتبقي: {formatCurrency(debt.remainingAmount, config.currency, config.language)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      من أصل {formatCurrency(debt.amount, config.currency, config.language)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {debt.remainingAmount > 0 && (
                      <button
                        onClick={() => onOpenRecordPayment(debt.id, debt.customerId)}
                        className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-all active:scale-95 flex items-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>أداء</span>
                      </button>
                    )}

                    {cust && (
                      <button
                        onClick={() =>
                          setWhatsAppModalData({
                            customer: cust,
                            debtId: debt.id,
                            template:
                              daysLeft <= 3 && daysLeft >= 0
                                ? 'due_soon'
                                : debt.remainingAmount > 0
                                ? 'gentle_reminder'
                                : 'appreciation',
                          })
                        }
                        className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 rounded-xl transition-all shadow-xs"
                        title="إرسال إشعار أو تذكير راقٍ عبر واتساب"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onEditDebt(debt)}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      title={t.editDebt}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(t.confirmDelete)) deleteDebt(debt.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      title={t.deleteDebt}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp Message Modal */}
      {whatsAppModalData && (
        <WhatsAppMessageModal
          customer={whatsAppModalData.customer}
          defaultDebtId={whatsAppModalData.debtId}
          initialTemplate={whatsAppModalData.template || 'gentle_reminder'}
          onClose={() => setWhatsAppModalData(null)}
        />
      )}
    </div>
  );
};
