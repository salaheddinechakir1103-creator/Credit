import React, { useState } from 'react';
import {
  X,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Send,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { Debt, Customer, DebtInstallment } from '../types/creditManager';
import { formatCurrency, formatDate, getWhatsAppUrl } from '../utils/formatters';
import { useCreditManager } from '../context/CreditManagerContext';

interface InstallmentPlanModalProps {
  debt: Debt;
  customer: Customer;
  onClose: () => void;
}

export const InstallmentPlanModal: React.FC<InstallmentPlanModalProps> = ({
  debt,
  customer,
  onClose,
}) => {
  const { updateDebt, config, userProfile } = useCreditManager();

  // Mode: view existing installments or generate new plan
  const existingInstallments = debt.installments || [];
  const [numberOfInstallments, setNumberOfInstallments] = useState<number>(3);
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [installments, setInstallments] = useState<DebtInstallment[]>(() => {
    if (existingInstallments.length > 0) return existingInstallments;
    // Generate default initial 3 installments for the remaining amount
    const count = 3;
    const baseAmount = Math.floor(debt.remainingAmount / count);
    const remainder = debt.remainingAmount - baseAmount * count;

    return Array.from({ length: count }, (_, i) => {
      const due = new Date();
      due.setMonth(due.getMonth() + i + 1);
      return {
        id: `inst-${Date.now()}-${i}`,
        installmentNumber: i + 1,
        amount: i === 0 ? baseAmount + remainder : baseAmount,
        dueDate: due.toISOString().split('T')[0],
        paidAmount: 0,
        status: 'pending',
        notes: `الدفعة رقم ${i + 1}`,
      };
    });
  });

  const handleGeneratePlan = () => {
    const count = Math.max(2, Math.min(24, numberOfInstallments));
    const baseAmount = Math.floor((debt.remainingAmount / count) * 100) / 100;
    const remainder = Math.round((debt.remainingAmount - baseAmount * count) * 100) / 100;

    const newInst: DebtInstallment[] = Array.from({ length: count }, (_, i) => {
      const due = new Date(startDate);
      if (frequency === 'weekly') {
        due.setDate(due.getDate() + (i + 1) * 7);
      } else if (frequency === 'biweekly') {
        due.setDate(due.getDate() + (i + 1) * 14);
      } else {
        due.setMonth(due.getMonth() + (i + 1));
      }

      return {
        id: `inst-${Date.now()}-${i}`,
        installmentNumber: i + 1,
        amount: i === 0 ? Number((baseAmount + remainder).toFixed(2)) : baseAmount,
        dueDate: due.toISOString().split('T')[0],
        paidAmount: 0,
        status: 'pending',
        notes: `الدفعة رقم ${i + 1}`,
      };
    });

    setInstallments(newInst);
  };

  const handleUpdateInstallmentAmount = (idx: number, newAmount: number) => {
    setInstallments((prev) =>
      prev.map((inst, i) => (i === idx ? { ...inst, amount: newAmount } : inst))
    );
  };

  const handleUpdateInstallmentDueDate = (idx: number, newDate: string) => {
    setInstallments((prev) =>
      prev.map((inst, i) => (i === idx ? { ...inst, dueDate: newDate } : inst))
    );
  };

  const handleToggleInstallmentPaid = (idx: number) => {
    setInstallments((prev) =>
      prev.map((inst, i) => {
        if (i !== idx) return inst;
        const isPaid = inst.status === 'paid';
        return {
          ...inst,
          status: isPaid ? 'pending' : 'paid',
          paidAmount: isPaid ? 0 : inst.amount,
          paidDate: isPaid ? undefined : new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const handleSavePlan = async () => {
    await updateDebt(debt.id, {
      installments,
      category: debt.category || 'دين بالتقسيط المجدول',
    });
    onClose();
  };

  const handleSendScheduleWhatsApp = () => {
    const planLines = installments
      .map(
        (inst) =>
          `🔹 *الدفعة ${inst.installmentNumber}:* ${formatCurrency(
            inst.amount,
            config.currency,
            config.language
          )} (تاريخ الاستحقاق: ${formatDate(inst.dueDate, config.language)}) - ${
            inst.status === 'paid' ? '✅ تم السداد' : '⏳ مستحقة'
          }`
      )
      .join('\n');

    const message = `السلام عليكم ورحمة الله أخي الفاضل *${customer.name}* 🤝
نضع بين أيديكم الكريمة جدول ومواعيد تسوية وتقسيط الرصيد المتفق عليه:

📊 *المبلغ الإجمالي المجدول:* *${formatCurrency(
      debt.remainingAmount,
      config.currency,
      config.language
    )}*
عدد الدفعات: *${installments.length} دفعات*

📅 *جدول المواعيد والأقساط:*
${planLines}

🏪 *${userProfile.businessName || 'متجر الأمانة'}*
نشكركم على حسن تعاونكم ووفائكم الدائم!`;

    const url = getWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank');
  };

  const totalCalculated = installments.reduce((sum, inst) => sum + inst.amount, 0);
  const isMatchTotal = Math.abs(totalCalculated - debt.remainingAmount) < 0.5;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">جدول تسوية وتقسيط الدين</h2>
              <p className="text-xs text-indigo-200">
                الزبون: {customer.name} | المبلغ المتبقي:{' '}
                {formatCurrency(debt.remainingAmount, config.currency, config.language)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white rounded-full hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Generator Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span>توليد جدول أقساط تلقائي:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                عدد الدفعات
              </label>
              <input
                type="number"
                min="2"
                max="24"
                value={numberOfInstallments}
                onChange={(e) => setNumberOfInstallments(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                دورية السداد
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value="weekly">أسبوعي (كل 7 أيام)</option>
                <option value="biweekly">نصف شهري (كل 15 يوماً)</option>
                <option value="monthly">شهري (كل شهر)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleGeneratePlan}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                إعادة تقسيم المبالغ
              </button>
            </div>
          </div>
        </div>

        {/* Installment Items List */}
        <div className="p-5 sm:p-6 space-y-3 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            <span>قائمة الدفعات المجدولة ({installments.length}):</span>
            <span
              className={`font-mono text-xs ${
                isMatchTotal ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              المجموع: {formatCurrency(totalCalculated, config.currency, config.language)}{' '}
              {!isMatchTotal && `(فارق: ${(debt.remainingAmount - totalCalculated).toFixed(2)})`}
            </span>
          </div>

          {installments.map((inst, idx) => (
            <div
              key={inst.id || idx}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                inst.status === 'paid'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleToggleInstallmentPaid(idx)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all shrink-0 ${
                    inst.status === 'paid'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100'
                  }`}
                  title={inst.status === 'paid' ? 'تم السداد - اضغط للإلغاء' : 'اضغط لتحديد كمسدد'}
                >
                  {inst.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </button>

                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    الدفعة #{inst.installmentNumber}
                  </span>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {inst.status === 'paid' ? (
                      <span className="text-emerald-600 font-bold">تم سدادها بنجاح</span>
                    ) : (
                      'تاريخ الاستحقاق'
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                {/* Date Picker */}
                <input
                  type="date"
                  value={inst.dueDate}
                  onChange={(e) => handleUpdateInstallmentDueDate(idx, e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white"
                />

                {/* Amount input */}
                <div className="relative w-28">
                  <input
                    type="number"
                    step="0.01"
                    value={inst.amount}
                    onChange={(e) =>
                      handleUpdateInstallmentAmount(idx, parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1 text-xs font-mono font-black text-end bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSendScheduleWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl hover:bg-emerald-200 transition-all shadow-xs"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>مشاركة الجدول بالواتساب</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSavePlan}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all active:scale-95"
            >
              حفظ الجدول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
