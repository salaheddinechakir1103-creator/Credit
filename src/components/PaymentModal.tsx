import React, { useState } from 'react';
import { X, Receipt, DollarSign, Calendar, CreditCard, CheckCircle2, Sparkles } from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { PaymentMethod } from '../types/creditManager';

interface PaymentModalProps {
  defaultDebtId?: string;
  defaultCustomerId?: string;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  defaultDebtId,
  defaultCustomerId,
  onClose,
}) => {
  const { debts, customers, recordPayment, config } = useCreditManager();
  const t = getTranslation(config.language);

  // Available debts for recording payment (must have remainingAmount > 0)
  const availableDebts = debts.filter((d) => {
    if (d.remainingAmount <= 0) return false;
    if (defaultCustomerId && d.customerId !== defaultCustomerId) return false;
    return true;
  });

  const [debtId, setDebtId] = useState<string>(
    defaultDebtId || availableDebts[0]?.id || ''
  );

  const selectedDebt = debts.find((d) => d.id === debtId);
  const selectedCustomer = selectedDebt
    ? customers.find((c) => c.id === selectedDebt.customerId)
    : null;

  const [amount, setAmount] = useState<string>(
    selectedDebt ? selectedDebt.remainingAmount.toString() : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  const handleDebtChange = (id: string) => {
    setDebtId(id);
    const d = debts.find((item) => item.id === id);
    if (d) setAmount(d.remainingAmount.toString());
  };

  const handleSetFullAmount = () => {
    if (selectedDebt) setAmount(selectedDebt.remainingAmount.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!debtId || isNaN(numAmount) || numAmount <= 0) return;

    recordPayment({
      debtId,
      amount: numAmount,
      paymentMethod,
      notes,
      paymentDate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">{t.recordPayment}</h2>
              <p className="text-xs text-emerald-200">تسجيل أداء كامل أو جزئي للدين وإصدار إيصال</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-full hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {availableDebts.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              جميع الديون موديّاة بالكامل!
            </h3>
            <p className="text-xs text-slate-400 mb-4">لا يوجد أي دين حالي مستحق يتطلب تسجيل عملية أداء</p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-800 rounded-xl"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Debt Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                اختر الدين المستحق
              </label>
              <select
                value={debtId}
                onChange={(e) => handleDebtChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              >
                {availableDebts.map((d) => {
                  const cust = customers.find((c) => c.id === d.customerId);
                  return (
                    <option key={d.id} value={d.id}>
                      {cust?.name || 'زبون'} — {d.category || 'دين'} (المتبقي:{' '}
                      {formatCurrency(d.remainingAmount, config.currency, config.language)})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Debt Info Summary Box */}
            {selectedDebt && selectedCustomer && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">
                    {selectedCustomer.name}
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    إجمالي الدين: {formatCurrency(selectedDebt.amount, config.currency, config.language)}
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400">المبلغ المتبقي</div>
                  <div className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
                    {formatCurrency(selectedDebt.remainingAmount, config.currency, config.language)}
                  </div>
                </div>
              </div>
            )}

            {/* Amount Paid */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.paymentAmount} ({config.currency})
                </label>
                <button
                  type="button"
                  onClick={handleSetFullAmount}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> تسوية المبلغ بالكامل
                </button>
              </div>

              <div className="relative">
                <DollarSign className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full ps-9 pe-3 py-2.5 text-xs sm:text-sm font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t.paymentMethod}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'cash', label: t.cash },
                  { id: 'transfer', label: t.transfer },
                  { id: 'card', label: t.card },
                  { id: 'check', label: t.check },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === method.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.paymentDate}
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظات عملية الأداء
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="رقم التحويل البنكي أو رقم الشيك..."
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            {/* Submit buttons */}
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
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-all active:scale-95"
              >
                تأكيد وتسجيل الإيصال
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
