import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, Calendar, Tag, DollarSign, FileText } from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { Debt, DebtType } from '../types/creditManager';
import { getTranslation } from '../utils/translations';

interface AddDebtModalProps {
  debtToEdit?: Debt | null;
  defaultCustomerId?: string;
  onClose: () => void;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({
  debtToEdit,
  defaultCustomerId,
  onClose,
}) => {
  const { customers, addDebt, updateDebt, config } = useCreditManager();
  const t = getTranslation(config.language);

  const [customerId, setCustomerId] = useState<string>(
    debtToEdit?.customerId || defaultCustomerId || customers[0]?.id || ''
  );
  const [type, setType] = useState<DebtType>(debtToEdit?.type || 'lya');
  const [amount, setAmount] = useState<string>(debtToEdit ? debtToEdit.amount.toString() : '');
  const [date, setDate] = useState<string>(
    debtToEdit?.date || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    debtToEdit?.dueDate ||
      new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<string>(debtToEdit?.category || '');
  const [notes, setNotes] = useState<string>(debtToEdit?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!customerId || isNaN(numAmount) || numAmount <= 0) return;

    if (debtToEdit) {
      updateDebt(debtToEdit.id, {
        customerId,
        type,
        amount: numAmount,
        date,
        dueDate,
        category,
        notes,
      });
    } else {
      addDebt({
        customerId,
        type,
        amount: numAmount,
        date,
        dueDate,
        category,
        notes,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <h2 className="text-base font-bold">
            {debtToEdit ? t.editDebt : t.addDebt}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Debt Type Selector (Lya vs Alya) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t.debtType}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('lya')}
                className={`p-3 rounded-2xl border text-start flex items-center gap-3 transition-all ${
                  type === 'lya'
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">{t.lyaShort}</div>
                  <div className="text-[10px] opacity-75">مستحق لي عند الزبون</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('alya')}
                className={`p-3 rounded-2xl border text-start flex items-center gap-3 transition-all ${
                  type === 'alya'
                    ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">{t.alyaShort}</div>
                  <div className="text-[10px] opacity-75">واجب عليّ أداؤه للمورد</div>
                </div>
              </button>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.customerName}
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.amount} ({config.currency})
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full ps-9 pe-3 py-2.5 text-xs sm:text-sm font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.category}
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="مثال: فاتورة بضاعة، كراء، سلعة..."
                  className="w-full ps-9 pe-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.date}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.dueDate}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.notes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="تفاصيل إضافية أو ملاحظات عن طريقة الأداء..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all active:scale-95"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
