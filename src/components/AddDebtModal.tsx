import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  CheckCircle2,
  Combine,
  Layers,
  Search,
  User,
  Phone,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { Debt, DebtType } from '../types/creditManager';
import { getTranslation } from '../utils/translations';
import { formatCurrency } from '../utils/formatters';

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
  const { customers, debts, addDebt, updateDebt, config } = useCreditManager();
  const t = getTranslation(config.language);

  const initialCustomerId = debtToEdit?.customerId || defaultCustomerId || (customers.length === 1 ? customers[0].id : '');
  const [customerId, setCustomerId] = useState<string>(initialCustomerId);
  const [searchCustomer, setSearchCustomer] = useState<string>('');
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
  const [mergeWithPrevious, setMergeWithPrevious] = useState<boolean>(true);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Filtered customer list for selection
  const filteredCustomers = useMemo(() => {
    if (!searchCustomer.trim()) return customers.slice(0, 10);
    const term = searchCustomer.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.address && c.address.toLowerCase().includes(term))
    );
  }, [customers, searchCustomer]);

  // Calculate previous unpaid balance for selected customer of same type
  const customerDebts = debts.filter(
    (d) => d.customerId === customerId && d.type === type && d.remainingAmount > 0
  );
  const previousBalance = customerDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const numAmount = parseFloat(amount) || 0;
  const newTotalBalance = previousBalance + numAmount;

  const isCustomerLocked = Boolean(defaultCustomerId || debtToEdit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      addDebt(
        {
          customerId,
          type,
          amount: numAmount,
          date,
          dueDate,
          category: category || (mergeWithPrevious && previousBalance > 0 ? 'بون إجمالي موحد' : 'دين جديد'),
          notes,
        },
        mergeWithPrevious && previousBalance > 0
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">
              {debtToEdit ? t.editDebt : t.addDebt}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {selectedCustomer
                ? `الزبون المعني بالأمر: ${selectedCustomer.name}`
                : 'إضافة مبلغ جديد لحساب الزبون'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Selection - Either locked card or quick search */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              الزبون المعني بالأمر
            </label>
            {selectedCustomer ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    {selectedCustomer.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {selectedCustomer.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        المعني بالأمر
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  </div>
                </div>

                {!isCustomerLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerId('');
                      setSearchCustomer('');
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    تغيير
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    placeholder="ابحث عن الزبون بالاسم أو الهاتف..."
                    className="w-full ps-9 pe-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    autoFocus
                  />
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pe-1 border border-slate-100 dark:border-slate-800 rounded-xl p-1">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCustomerId(c.id)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg text-start flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200"
                    >
                      <span>{c.name}</span>
                      <span className="text-[11px] text-slate-400 font-normal">{c.phone}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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

          {/* Previous Balance Banner & Merge Toggle for the concerned customer */}
          {!debtToEdit && customerId && previousBalance > 0 && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-900 dark:text-indigo-200 font-semibold">
                  الرصيد السابق للزبون المعني:
                </span>
                <span className="font-bold text-indigo-900 dark:text-indigo-200">
                  {formatCurrency(previousBalance, config.currency, config.language)}
                </span>
              </div>

              {numAmount > 0 && (
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 pt-1.5 border-t border-indigo-200/60 dark:border-indigo-900/60">
                  <span>المجموع الإجمالي (القديم + الجديد):</span>
                  <span className="text-sm">
                    {formatCurrency(newTotalBalance, config.currency, config.language)}
                  </span>
                </div>
              )}

              <label className="flex items-center gap-2 pt-1 cursor-pointer text-xs font-bold text-indigo-900 dark:text-indigo-200">
                <input
                  type="checkbox"
                  checked={mergeWithPrevious}
                  onChange={(e) => setMergeWithPrevious(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="flex items-center gap-1">
                  <Combine className="w-3.5 h-3.5 text-indigo-600" />
                  دمج مع الرصيد السابق ليصبح بوناً واحداً بمبلغ إجمالي
                </span>
              </label>
            </div>
          )}

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
              disabled={!customerId}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow transition-all active:scale-95"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
