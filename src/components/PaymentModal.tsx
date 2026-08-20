import React, { useState, useMemo } from 'react';
import {
  X,
  Receipt,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Users,
  Layers,
  FileCheck,
  Check,
  ChevronDown,
  Info,
  Combine,
  Search,
  UserCheck,
  UserX,
  ArrowRight,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { WhatsAppMessageModal } from './WhatsAppMessageModal';
import { PaymentMethod, Customer, Transaction } from '../types/creditManager';

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
  const { debts, customers, recordPayment, consolidateCustomerDebts, config } = useCreditManager();
  const t = getTranslation(config.language);

  // Group all customers who have remaining debt
  const debtorCustomers = useMemo(() => {
    return customers
      .map((cust) => {
        const custDebts = debts.filter((d) => d.customerId === cust.id && d.remainingAmount > 0);
        const totalRemaining = custDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
        const totalOriginal = custDebts.reduce((sum, d) => sum + d.amount, 0);
        return {
          customer: cust,
          debts: custDebts,
          debtCount: custDebts.length,
          totalRemaining,
          totalOriginal,
        };
      })
      .filter((item) => item.totalRemaining > 0);
  }, [customers, debts]);

  // Determine initial selected customer ID
  const resolvedInitialCustomerId = useMemo(() => {
    if (defaultCustomerId) return defaultCustomerId;
    if (defaultDebtId) {
      const debt = debts.find((d) => d.id === defaultDebtId);
      if (debt) return debt.customerId;
    }
    return '';
  }, [defaultCustomerId, defaultDebtId, debts]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(resolvedInitialCustomerId);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [paySpecificDebtOnly, setPaySpecificDebtOnly] = useState<boolean>(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string>(defaultDebtId || '');
  const [isConsolidating, setIsConsolidating] = useState<boolean>(false);

  // The specific debtor currently selected (المعني بالأمر)
  const currentDebtor = debtorCustomers.find((item) => item.customer.id === selectedCustomerId);
  const selectedDebt = currentDebtor?.debts.find((d) => d.id === selectedDebtId);

  // Filtered debtors for when no customer is pre-selected
  const filteredDebtors = useMemo(() => {
    if (!searchTerm.trim()) return debtorCustomers;
    const term = searchTerm.toLowerCase();
    return debtorCustomers.filter(
      (d) =>
        d.customer.name.toLowerCase().includes(term) ||
        d.customer.phone.includes(term) ||
        (d.customer.address && d.customer.address.toLowerCase().includes(term))
    );
  }, [debtorCustomers, searchTerm]);

  // Default payment amount
  const [amount, setAmount] = useState<string>(() => {
    if (defaultDebtId) {
      const d = debts.find((x) => x.id === defaultDebtId);
      if (d) return d.remainingAmount.toString();
    }
    if (currentDebtor) {
      return currentDebtor.totalRemaining.toString();
    }
    return '';
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [completedPaymentCustomer, setCompletedPaymentCustomer] = useState<Customer | null>(null);
  const [openReceiptWhatsApp, setOpenReceiptWhatsApp] = useState<boolean>(false);

  const handleSelectCustomer = (cId: string) => {
    setSelectedCustomerId(cId);
    setPaySpecificDebtOnly(false);
    setSelectedDebtId('');
    const debtor = debtorCustomers.find((item) => item.customer.id === cId);
    if (debtor) {
      setAmount(debtor.totalRemaining.toString());
    }
  };

  const handleSetFullAmount = () => {
    if (paySpecificDebtOnly && selectedDebt) {
      setAmount(selectedDebt.remainingAmount.toString());
    } else if (currentDebtor) {
      setAmount(currentDebtor.totalRemaining.toString());
    }
  };

  const handleConsolidateNow = async () => {
    if (!selectedCustomerId) return;
    setIsConsolidating(true);
    await consolidateCustomerDebts(selectedCustomerId);
    setIsConsolidating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!selectedCustomerId || isNaN(numAmount) || numAmount <= 0) return;

    await recordPayment({
      customerId: selectedCustomerId,
      debtId: paySpecificDebtOnly ? selectedDebtId : undefined,
      amount: numAmount,
      paymentMethod,
      notes: notes || (paySpecificDebtOnly ? `أداء بون محدد` : `أداء على الحساب الإجمالي الموحد`),
      paymentDate,
    });

    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (cust) {
      setCompletedPaymentCustomer(cust);
    } else {
      onClose();
    }
  };

  // If a specific customer is designated or picked, we show ONLY the concerned customer form
  const isCustomerLocked = Boolean(defaultCustomerId || defaultDebtId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">تسجيل أداء على الحساب الموحد</h2>
              <p className="text-xs text-emerald-200">
                {currentDebtor
                  ? `الحساب المعني: ${currentDebtor.customer.name}`
                  : 'تسوية الديون القديمة والجديدة بوناً واحداً'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-full hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body or Success Body */}
        {completedPaymentCustomer ? (
          <div className="p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تم تسجيل وتوثيق عملية الأداء بنجاح!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تم تحديث رصيد الزبون <strong className="text-slate-800 dark:text-slate-200">{completedPaymentCustomer.name}</strong> بمبلغ{' '}
                <strong className="text-emerald-600 font-mono">{formatCurrency(parseFloat(amount) || 0, config.currency, config.language)}</strong>
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-start space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>المستلم:</span>
                <span className="font-bold">{completedPaymentCustomer.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>المبلغ المؤدى:</span>
                <span className="font-extrabold text-emerald-600 font-mono">
                  {formatCurrency(parseFloat(amount) || 0, config.currency, config.language)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>تاريخ الأداء:</span>
                <span>{paymentDate}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setOpenReceiptWhatsApp(true)}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>إرسال وصل الأداء عبر WhatsApp</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                تم / إغلاق
              </button>
            </div>
          </div>
        ) : debtorCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              جميع حسابات الزبناء مسددة بالكامل!
            </h3>
            <p className="text-xs text-slate-400 mb-4">لا يوجد أي دين حالي مستحق يتطلب تسجيل عملية أداء</p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-800 rounded-xl"
            >
              إغلاق
            </button>
          </div>
        ) : !selectedCustomerId ? (
          /* Step 1: When opened globally with no customer pre-selected, search & pick ONLY the concerned customer */
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                اختر الزبون المعني بالأمر لتسجيل الأداء:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث بالاسم أو رقم الهاتف..."
                  className="w-full ps-9 pe-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  autoFocus
                />
              </div>
            </div>

            {/* List of matching debtors only */}
            <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
              {filteredDebtors.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  لا يوجد زبون مدين يطابق البحث "{searchTerm}"
                </div>
              ) : (
                filteredDebtors.map(({ customer, totalRemaining, debtCount }) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelectCustomer(customer.id)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 transition-all flex items-center justify-between text-start group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-xs">
                        {customer.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                          {customer.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {customer.phone} {debtCount > 1 ? `• (${debtCount} بونات قديمة وجديدة)` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-end">
                      <div className="text-[10px] text-slate-400 font-medium">إجمالي المستحق</div>
                      <div className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(totalRemaining, config.currency, config.language)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Step 2: Form locked exclusively to the concerned customer (المعني بالأمر فقط) */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* The Concerned Customer Identity Card */}
            {currentDebtor && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/70 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-300 dark:border-emerald-900 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                      {currentDebtor.customer.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-950 dark:text-emerald-100">
                          {currentDebtor.customer.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-200">
                          المعني بالأمر
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{currentDebtor.customer.phone}</span>
                        {currentDebtor.debtCount > 1 && (
                          <span>• ({currentDebtor.debtCount} بونات مجمعة)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      المجموع الإجمالي المطلوب
                    </div>
                    <div className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                      {formatCurrency(currentDebtor.totalRemaining, config.currency, config.language)}
                    </div>
                  </div>
                </div>

                {/* Switch customer button if not locked from source */}
                {!isCustomerLocked && debtorCustomers.length > 1 && (
                  <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setSearchTerm('');
                      }}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      ← تغيير الزبون المعني
                    </button>
                  </div>
                )}

                {/* Multiple Debts Breakdown & 1-Click Consolidation for this customer */}
                {currentDebtor.debtCount > 1 && (
                  <div className="pt-2.5 border-t border-emerald-200/60 dark:border-emerald-900/60 space-y-2">
                    <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                      <span>تفاصيل البونات المكونة للمبلغ ({currentDebtor.debtCount}):</span>
                      <button
                        type="button"
                        onClick={handleConsolidateNow}
                        disabled={isConsolidating}
                        className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 bg-white dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-xs"
                        title="دمج جميع البونات في بون واحد نهائي"
                      >
                        <Combine className="w-3 h-3" />
                        <span>دمج في بون واحد نهائي</span>
                      </button>
                    </div>

                    <div className="space-y-1 max-h-24 overflow-y-auto pe-1">
                      {currentDebtor.debts.map((d, index) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between text-[11px] bg-white/80 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-950"
                        >
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                            {index === 0 ? '• بون سابق' : '• بون إضافي'}:{' '}
                            {d.category || 'دين بضاعة'} ({formatDate(d.date, config.language)})
                          </span>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                            {formatCurrency(d.remainingAmount, config.currency, config.language)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Amount */}
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
                  <Sparkles className="w-3 h-3" /> تسوية إجمالي الحساب بالكامل
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
              <p className="text-[10px] text-slate-400 mt-1">
                يمكنك تسديد المبلغ كاملاً أو إدخال دفعة جزئية (تسبيق) ليتم خصمها تلقائياً من الحساب
              </p>
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
                ملاحظات وتفاصيل الإيصال
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="تسوية حساب، رقم التحويل البنكي، أو رقم الشيك..."
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
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد وتسجيل إيصال الأداء</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* WhatsApp Receipt Message Modal */}
      {openReceiptWhatsApp && completedPaymentCustomer && (
        <WhatsAppMessageModal
          customer={completedPaymentCustomer}
          initialTemplate="payment_receipt"
          onClose={() => {
            setOpenReceiptWhatsApp(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
