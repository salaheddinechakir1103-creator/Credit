import React, { useState } from 'react';
import { X, Scissors, Plus, Trash2, Calendar, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Debt, Customer } from '../types/creditManager';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate } from '../utils/formatters';

interface SplitDebtModalProps {
  debt: Debt;
  customer: Customer;
  onClose: () => void;
}

interface SplitItem {
  id: string;
  category: string;
  amount: string;
  remainingAmount: string;
  date: string;
  notes: string;
}

export const SplitDebtModal: React.FC<SplitDebtModalProps> = ({
  debt,
  customer,
  onClose,
}) => {
  const { splitDebt, config } = useCreditManager();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse existing merged category
  const [items, setItems] = useState<SplitItem[]>(() => {
    let parts: string[] = [];
    if (debt.category && debt.category.includes('+')) {
      parts = debt.category
        .split('+')
        .map((p) => p.trim())
        .filter(Boolean);
    }

    if (parts.length === 0) {
      parts = [debt.category || 'دين بضاعة 1', 'دين بضاعة 2'];
    }

    const count = parts.length;
    const baseAmount = Math.floor((debt.amount / count) * 100) / 100;
    const baseRemaining = Math.floor((debt.remainingAmount / count) * 100) / 100;

    return parts.map((part, index) => {
      // Adjust last item for rounding differences
      const isLast = index === count - 1;
      const partAmount = isLast
        ? (debt.amount - baseAmount * (count - 1)).toFixed(2)
        : baseAmount.toFixed(2);
      const partRemaining = isLast
        ? (debt.remainingAmount - baseRemaining * (count - 1)).toFixed(2)
        : baseRemaining.toFixed(2);

      return {
        id: `split-${index}-${Date.now()}`,
        category: part,
        amount: partAmount,
        remainingAmount: partRemaining,
        date: debt.date || new Date().toISOString().split('T')[0],
        notes: '',
      };
    });
  });

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `split-${Date.now()}`,
        category: `بون تفصيلي ${prev.length + 1}`,
        amount: '0',
        remainingAmount: '0',
        date: debt.date || new Date().toISOString().split('T')[0],
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof SplitItem, value: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        // If amount changed and remaining was equal to previous amount, keep in sync
        if (field === 'amount' && it.remainingAmount === it.amount) {
          updated.remainingAmount = value;
        }
        return updated;
      })
    );
  };

  const handleDistributeEqually = () => {
    const count = items.length;
    if (count === 0) return;
    const baseAmount = Math.floor((debt.amount / count) * 100) / 100;
    const baseRemaining = Math.floor((debt.remainingAmount / count) * 100) / 100;

    setItems((prev) =>
      prev.map((it, idx) => {
        const isLast = idx === count - 1;
        const amt = isLast
          ? (debt.amount - baseAmount * (count - 1)).toFixed(2)
          : baseAmount.toFixed(2);
        const rem = isLast
          ? (debt.remainingAmount - baseRemaining * (count - 1)).toFixed(2)
          : baseRemaining.toFixed(2);
        return {
          ...it,
          amount: amt,
          remainingAmount: rem,
        };
      })
    );
  };

  const totalItemAmounts = items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
  const totalItemRemaining = items.reduce(
    (sum, it) => sum + (parseFloat(it.remainingAmount) || 0),
    0
  );

  const amountDiff = Math.abs(totalItemAmounts - debt.amount);
  const isAmountMatching = amountDiff < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const parts = items.map((it) => {
        const amt = parseFloat(it.amount) || 0;
        const rem = it.remainingAmount !== '' ? parseFloat(it.remainingAmount) : amt;
        return {
          category: it.category.trim() || 'دين مفصل',
          amount: amt,
          remainingAmount: isNaN(rem) ? amt : rem,
          date: it.date || debt.date,
          notes: it.notes.trim(),
        };
      });

      await splitDebt(debt.id, parts);
      onClose();
    } catch (err) {
      console.error('Error splitting debt:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center text-white shadow-md">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">
                تفكيك وتفصيل الدين (Détailler les bons)
              </h2>
              <p className="text-xs text-indigo-200">
                فصل المعاملة المدمجة إلى بونات مفصلة ومستقلة للزبون: <span className="font-bold text-white">{customer.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Current Merged Debt Overview */}
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>البيان المدمج الحالي:</span>
                <span className="bg-amber-200 dark:bg-amber-900/80 px-2 py-0.5 rounded-lg text-amber-950 dark:text-amber-100 font-mono text-xs font-black">
                  {debt.category}
                </span>
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-300">
                تاريخ المعاملة: {formatDate(debt.date, config.language)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/60 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">المبلغ الأصلي المدمج:</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {formatCurrency(debt.amount, config.currency, config.language)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">المتبقي غير المسدد:</span>
                <span className="font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(debt.remainingAmount, config.currency, config.language)}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">المبلغ المؤدى سابقاً:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(debt.amount - debt.remainingAmount, config.currency, config.language)}
                </span>
              </div>
            </div>
          </div>

          {/* Instruction & Tools bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>قائمة البونات المفصلة الناتجة:</span>
              <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-[11px]">
                {items.length} بونات
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDistributeEqually}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="تقسيم المبالغ بالتساوي على البونات"
              >
                <RefreshCw className="w-3 h-3" />
                <span>تقسيم بالتساوي</span>
              </button>

              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>+ إضافة بون تفصيلي</span>
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 shadow-xs relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      بون مستقل #{idx + 1}
                    </span>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-all cursor-pointer"
                      title="حذف هذا البون التفصيلي"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  {/* Category / Title */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      البيان / نوع البون أو الفاتورة
                    </label>
                    <input
                      type="text"
                      value={it.category}
                      onChange={(e) => handleUpdateItem(it.id, 'category', e.target.value)}
                      placeholder="مثال: فاتورة سلعة، بون يوم..."
                      required
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>

                  {/* Original Amount */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      المبلغ الأصلي ({config.currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={it.amount}
                      onChange={(e) => handleUpdateItem(it.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full px-3 py-2 text-xs font-black font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>

                  {/* Remaining Amount */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      المتبقي غير المسدد ({config.currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={it.remainingAmount}
                      onChange={(e) => handleUpdateItem(it.id, 'remainingAmount', e.target.value)}
                      placeholder={it.amount}
                      required
                      className="w-full px-3 py-2 text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="sm:col-span-4">
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 absolute inset-y-0 my-auto start-2.5 text-slate-400" />
                      <input
                        type="date"
                        value={it.date}
                        onChange={(e) => handleUpdateItem(it.id, 'date', e.target.value)}
                        className="w-full ps-8 pe-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      value={it.notes}
                      onChange={(e) => handleUpdateItem(it.id, 'notes', e.target.value)}
                      placeholder="ملاحظة إضافية لهذا البون التفصيلي (اختياري)..."
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Validation & Balance Check Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">مجموع المبالغ المفصلة:</span>
                <span className="font-black text-sm text-slate-900 dark:text-white">
                  {formatCurrency(totalItemAmounts, config.currency, config.language)}
                </span>
                <span className="text-slate-400">من أصل {formatCurrency(debt.amount, config.currency, config.language)}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">مجموع المتبقي:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(totalItemRemaining, config.currency, config.language)}
                </span>
                <span className="text-slate-400">من أصل {formatCurrency(debt.remainingAmount, config.currency, config.language)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isAmountMatching ? (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>المجموع مطابق 100%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>الفارق: {formatCurrency(amountDiff, config.currency, config.language)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            عند الحفظ، سيتم تعويض الدين المدمج بالبونات المفصلة المستقلة أعلاه.
          </p>

          <div className="flex items-center gap-2 ms-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || items.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Scissors className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'تأكيد تفكيك وحفظ البونات المفصلة'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
