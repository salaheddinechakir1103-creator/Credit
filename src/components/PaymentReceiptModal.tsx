import React, { useRef } from 'react';
import {
  X,
  Printer,
  Share2,
  Download,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  Phone,
  Building2,
  FileCheck,
  Receipt,
  MessageCircle,
} from 'lucide-react';
import { Customer, Transaction, Debt } from '../types/creditManager';
import { formatCurrency, formatDate, getWhatsAppUrl } from '../utils/formatters';
import { useCreditManager } from '../context/CreditManagerContext';

interface PaymentReceiptModalProps {
  customer: Customer;
  transaction: Transaction;
  remainingBalance?: number;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  customer,
  transaction,
  remainingBalance = 0,
  onClose,
}) => {
  const { config, userProfile, debts } = useCreditManager();
  const receiptRef = useRef<HTMLDivElement>(null);

  const businessName = userProfile.businessName || 'متجر الأمانة للتجارة';
  const businessPhone = userProfile.phone || '';
  const businessEmail = userProfile.email || '';

  // Calculate actual remaining debts
  const currentCustomerDebts = debts.filter(
    (d) => d.customerId === customer.id && d.type === 'lya' && d.remainingAmount > 0
  );
  const totalCustomerRemaining = currentCustomerDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const text = `🧾 *وصل استلام مالي رسمي - ${businessName}*
رقم الوصل: *${transaction.receiptNumber || 'REC-' + transaction.id.slice(-6)}*
التاريخ: *${formatDate(transaction.paymentDate, config.language)}*

👤 *الزبون المحترم:* ${customer.name}
💰 *المبلغ المستلم:* *${formatCurrency(transaction.amount, config.currency, config.language)}*
💳 *طريقة الدفع:* ${
      transaction.paymentMethod === 'cash'
        ? 'نقداً (كاش)'
        : transaction.paymentMethod === 'transfer'
        ? 'تحويل بنكي'
        : transaction.paymentMethod === 'check'
        ? 'شيك'
        : 'بطاقة بنكية'
    }
📌 *البيان:* ${transaction.notes || 'سداد دفعة من الحساب'}
📊 *الرصيد المتبقي بذمتكم:* *${formatCurrency(totalCustomerRemaining, config.currency, config.language)}*

🙏 *نشكركم على حسن وفائكم وتعاملكم الراقي الدائم معنا!*
🏪 *${businessName}* | 📞 ${businessPhone}`;

    const url = getWhatsAppUrl(customer.phone, text);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200 print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none">
        {/* Header Actions (hidden when printing) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">وصل استلام دفعة مالية (Receipt)</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال بالواتساب</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div
          ref={receiptRef}
          className="p-6 sm:p-8 bg-white text-slate-900 space-y-6 font-sans border-b-4 border-dashed border-slate-300 print:p-4 print:border-none"
          dir="rtl"
        >
          {/* Top Brand & Header */}
          <div className="text-center space-y-1 border-b border-slate-200 pb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mb-1 font-black text-xl">
              {businessName.slice(0, 1)}
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{businessName}</h2>
            <p className="text-xs text-slate-500">
              {businessPhone ? `هاتف: ${businessPhone}` : 'إدارة الديون والحسابات التجارية'}
            </p>
            <div className="pt-2">
              <span className="px-3 py-1 bg-slate-900 text-white text-[11px] font-black rounded-full uppercase tracking-wider">
                وصل استلام مالي رسمي
              </span>
            </div>
          </div>

          {/* Receipt Info Numbers */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px]">رقم الوصل:</span>
              <span className="font-mono font-black text-slate-800">
                {transaction.receiptNumber || `REC-${transaction.id.slice(-6).toUpperCase()}`}
              </span>
            </div>
            <div className="text-start">
              <span className="text-slate-400 block text-[10px]">تاريخ ووقت الأداء:</span>
              <span className="font-bold text-slate-800">
                {formatDate(transaction.paymentDate, config.language)}
              </span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">الزبون المحترم:</span>
              <span className="font-extrabold text-slate-900 text-sm">{customer.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">رقم الهاتف:</span>
              <span className="font-mono text-slate-700">{customer.phone}</span>
            </div>
            {customer.address && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">العنوان:</span>
                <span className="text-slate-700">{customer.address}</span>
              </div>
            )}
          </div>

          {/* Paid Amount Box (Big Highlight) */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl text-center space-y-1">
            <span className="text-xs font-bold text-emerald-800 block">المبلغ المقبوض والمؤدى</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
              {formatCurrency(transaction.amount, config.currency, config.language)}
            </div>
            <div className="text-[11px] text-emerald-800 font-medium">
              طريقة الدفع:{' '}
              <strong className="font-bold">
                {transaction.paymentMethod === 'cash'
                  ? 'نقداً (كاش)'
                  : transaction.paymentMethod === 'transfer'
                  ? 'تحويل بنكي'
                  : transaction.paymentMethod === 'check'
                  ? 'شيك'
                  : 'بطاقة بنكية'}
              </strong>
            </div>
          </div>

          {/* Details & Remaining Balance */}
          <div className="space-y-2 text-xs">
            {transaction.notes && (
              <div className="flex justify-between items-start py-1 border-b border-slate-100">
                <span className="text-slate-500">البيان / ملاحظات:</span>
                <span className="font-semibold text-slate-800 text-end max-w-[200px]">
                  {transaction.notes}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b-2 border-slate-200 font-bold">
              <span className="text-slate-800">الرصيد المتبقي بعد هذا الأداء:</span>
              <span
                className={`font-mono text-sm ${
                  totalCustomerRemaining > 0 ? 'text-rose-600 font-black' : 'text-emerald-600'
                }`}
              >
                {totalCustomerRemaining > 0
                  ? formatCurrency(totalCustomerRemaining, config.currency, config.language)
                  : 'خالص بالكامل (0.00)'}
              </span>
            </div>
          </div>

          {/* Signature / Stamp area */}
          <div className="pt-4 grid grid-cols-2 gap-4 text-center text-xs text-slate-500">
            <div className="p-3 border border-slate-200 rounded-xl space-y-6">
              <span>توقيع / خاتم المتجر</span>
              <div className="h-6 font-handwriting text-slate-800 font-bold">{businessName}</div>
            </div>
            <div className="p-3 border border-slate-200 rounded-xl space-y-6">
              <span>توقيع المستلم / الزبون</span>
              <div className="h-6 text-slate-400 italic">................</div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 text-[10px] text-slate-400 space-y-0.5">
            <p>نشكركم جزيل الشكر على حسن تعاملكم والتزامكم المبارك 🤝</p>
            <p className="font-mono">تم إصدار الوصل عبر تطبيق Credit Manager</p>
          </div>
        </div>

        {/* Bottom Bar Actions (hidden in print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            إغلاق
          </button>
          <button
            onClick={handleSendWhatsApp}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>مشاركة بالواتساب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
