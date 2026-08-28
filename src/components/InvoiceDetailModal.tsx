import React, { useState } from 'react';
import {
  X,
  Receipt,
  Calendar,
  Phone,
  User,
  Printer,
  Share2,
  MessageCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Building2,
  ShoppingBag,
  CreditCard,
  Percent,
  Edit,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { Invoice } from '../types/creditManager';
import { formatCurrency, formatDate, getWhatsAppUrl } from '../utils/formatters';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onDelete?: () => void;
  onEdit?: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onDelete,
  onEdit,
}) => {
  const { customers, deleteInvoice, config, userProfile, debts } = useCreditManager();
  const customer = customers.find((c) => c.id === invoice.customerId);

  // Total current debt of this customer
  const currentTotalDebt = debts
    .filter((d) => d.customerId === invoice.customerId && d.type === 'lya' && d.remainingAmount > 0)
    .reduce((sum, d) => sum + d.remainingAmount, 0);

  // Calculate previous balance (الرصيد السابق / الكريدي القديم) and new total balance
  const previousBalance =
    invoice.previousBalance !== undefined
      ? invoice.previousBalance
      : debts
          .filter(
            (d) =>
              d.customerId === invoice.customerId &&
              d.type === 'lya' &&
              d.id !== invoice.debtId &&
              d.remainingAmount > 0
          )
          .reduce((sum, d) => sum + d.remainingAmount, 0);

  const newTotalDebt =
    invoice.newTotalBalance !== undefined
      ? invoice.newTotalBalance
      : previousBalance + invoice.remainingAmount;

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const handleSendWhatsApp = () => {
    if (!customer?.phone) return;

    const itemsSummary = invoice.items
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
    if (invoice.paymentType === 'cash' || invoice.remainingAmount === 0) {
      paymentStatusText = `✅ *حالة الفاتورة:* مدفوعة كاش بالكامل (${formatCurrency(
        invoice.totalAmount,
        config.currency,
        config.language
      )})`;
    } else if (invoice.paidAmount > 0) {
      paymentStatusText = `🔸 *المسدد مسبقاً (تسبيق):* ${formatCurrency(
        invoice.paidAmount,
        config.currency,
        config.language
      )}\n🔴 *المتبقي المضاف لحسابكم:* *${formatCurrency(
        invoice.remainingAmount,
        config.currency,
        config.language
      )}*`;
    } else {
      paymentStatusText = `🔴 *المبلغ المضاف لحسابكم (كريدي):* *${formatCurrency(
        invoice.totalAmount,
        config.currency,
        config.language
      )}*`;
    }

    const message = `السلام عليكم ورحمة الله وبركاته 🌹
أخي الفاضل / أختي الكريمة: *${customer.name}*
تحية طيبة مباركة من *${userProfile.businessName || 'متجر الأمانة للتجارة'}* ✨

📄 *فاتورة مشتريات رقم #${invoice.invoiceNumber}*
📅 التاريخ: ${formatDate(invoice.date, config.language)}
${invoice.dueDate ? `⏰ موعد السداد المتفق عليه: ${formatDate(invoice.dueDate, config.language)}\n` : ''}
🛒 *تفاصيل المشتريات:*
${itemsSummary}

💰 *إجمالي الفاتورة:* *${formatCurrency(invoice.totalAmount, config.currency, config.language)}*${
  (invoice.transportFee || 0) > 0
    ? `\n🚚 *مصاريف النقل (Transport):* ${formatCurrency(
        invoice.transportFee!,
        config.currency,
        config.language
      )}`
    : ''
}
${paymentStatusText}
📋 *الرصيد السابق (الكريدي القديم):* ${formatCurrency(previousBalance, config.currency, config.language)}
${
  invoice.remainingAmount > 0
    ? `📊 *إجمالي رصيدكم الكلي الحالي في السجل:* *${formatCurrency(
        newTotalDebt,
        config.currency,
        config.language
      )}*`
    : ''
}

نشكركم جزيلاً على ثقتكم الغالية ويسرنا دائماً خدمتكم بأفضل ما لدينا 🌸
${userProfile.phone ? `📞 للتواصل والاستفسار: ${userProfile.phone}` : ''}`;

    const url = getWhatsAppUrl(customer.phone, message);
    window.open(url, '_blank');
  };

  const handleDeleteInvoice = async () => {
    if (
      window.confirm(
        'هل أنت متأكد من حذف هذه الفاتورة؟ سيتم أيضاً خصم قيمة الدين المرتبط بها من حساب الزبون.'
      )
    ) {
      await deleteInvoice(invoice.id, true);
      if (onDelete) onDelete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Top Controls Bar (Hidden when printing) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm sm:text-base font-extrabold">
              فاتورة رقم: #{invoice.invoiceNumber}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(invoice);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all active:scale-95"
                title="تعديل الفاتورة"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">تعديل الفاتورة</span>
              </button>
            )}

            {customer?.phone && (
              <button
                onClick={handleSendWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all active:scale-95"
                title="إرسال الفاتورة عبر واتساب"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">إرسال بالواتساب</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all active:scale-95"
              title="طباعة الفاتورة"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة / PDF</span>
            </button>

            <button
              onClick={handleDeleteInvoice}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-xl transition-all"
              title="حذف الفاتورة"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Paper Canvas */}
        <div
          id="printable-invoice"
          className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 print:text-black print:p-0 print:overflow-visible"
        >
          {/* Business & Customer Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-900 dark:text-white">
                    {userProfile.businessName || 'متجر الأمانة للتجارة'}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    التاجر المسؤول: {userProfile.name}
                  </p>
                </div>
              </div>
              {userProfile.phone && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" />
                  <span>الهاتف: {userProfile.phone}</span>
                </p>
              )}
            </div>

            {/* Customer Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 min-w-[240px]">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                الزبون المعني بالأمر:
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {customer?.name || 'زبون عام'}
              </div>
              {customer?.phone && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer?.address && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  العنوان: {customer.address}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Meta details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                رقم الفاتورة:
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                #{invoice.invoiceNumber}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                تاريخ الإصدار:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatDate(invoice.date, config.language)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                تاريخ الاستحقاق:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {invoice.dueDate ? formatDate(invoice.dueDate, config.language) : 'فوري'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                نوع السداد:
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                  invoice.paymentType === 'cash'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : invoice.paymentType === 'partial'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                }`}
              >
                {invoice.paymentType === 'cash'
                  ? 'كاش نقدي'
                  : invoice.paymentType === 'partial'
                  ? 'تسبيق + كريدي'
                  : 'كريدي (على الحساب)'}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-20">الكمية (Qté)</th>
                    <th className="py-2.5 px-3 text-start">الموديل / السلعة (Modèle)</th>
                    <th className="py-2.5 px-3 text-center w-32 sm:w-36">السعر (Prix)</th>
                    <th className="py-2.5 px-3 text-end w-32 sm:w-36">السعر الإجمالي (Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-center font-black font-mono text-slate-900 dark:text-white text-xs bg-slate-50/50 dark:bg-slate-800/30">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white text-start">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(item.unitPrice, config.currency, config.language)}
                      </td>
                      <td className="py-2.5 px-3 text-end font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20">
                        {formatCurrency(item.total, config.currency, config.language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            {/* Notes & Terms */}
            <div className="w-full sm:w-1/2 space-y-2 text-xs">
              {invoice.notes && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold block text-slate-700 dark:text-slate-300 mb-0.5">
                    ملاحظات:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">{invoice.notes}</p>
                </div>
              )}

              <div className="text-[11px] text-slate-400 leading-relaxed">
                * تم تقييد هذه الفاتورة في السجل الإلكتروني وتحديث رصيد الزبون تلقائياً.
              </div>
            </div>

            {/* Calculations Box */}
            <div className="w-full sm:w-1/2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">
                  {formatCurrency(invoice.subtotal, config.currency, config.language)}
                </span>
              </div>

              {invoice.discount > 0 && (
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <span>الخصم الممنوح:</span>
                  <span className="font-bold">
                    -{formatCurrency(invoice.discount, config.currency, config.language)}
                  </span>
                </div>
              )}

              {(invoice.transportFee || 0) > 0 && (
                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                  <span>مصاريف النقل (Transport):</span>
                  <span className="font-bold font-mono">
                    +{formatCurrency(invoice.transportFee!, config.currency, config.language)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>إجمالي الفاتورة:</span>
                <span className="text-base text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(invoice.totalAmount, config.currency, config.language)}
                </span>
              </div>

              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 pt-1">
                <span>المبلغ المؤدى (تسبيق / نقد):</span>
                <span className="font-bold">
                  {formatCurrency(invoice.paidAmount, config.currency, config.language)}
                </span>
              </div>

              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-extrabold pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>المبلغ المتبقي (المضاف للكريدي):</span>
                <span className="text-base">
                  {formatCurrency(invoice.remainingAmount, config.currency, config.language)}
                </span>
              </div>

              {/* Total l9dim (الكريدي القديم / الرصيد السابق) */}
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold pt-2 border-t border-dashed border-slate-300 dark:border-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  <span>الرصيد السابق (الكريدي القديم):</span>
                </span>
                <span className="font-black font-mono text-slate-900 dark:text-slate-100 text-sm">
                  {formatCurrency(previousBalance, config.currency, config.language)}
                </span>
              </div>

              {/* Total Jdid (الرصيد الإجمالي الجديد بعد الفاتورة) */}
              <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-200 bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 p-2.5 rounded-xl font-black mt-1">
                <span className="flex items-center gap-1.5">
                  <span>الرصيد الإجمالي الجديد (مجموع الكريدي):</span>
                </span>
                <span className="text-base font-mono font-black text-indigo-700 dark:text-indigo-300">
                  {formatCurrency(newTotalDebt, config.currency, config.language)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-MA')}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
