import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  MessageCircle,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Receipt,
  User,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate, getWhatsAppUrl } from '../utils/formatters';
import { exportCustomerStatementToExcel } from '../utils/excelExport';
import { WhatsAppMessageModal } from './WhatsAppMessageModal';
import { Customer, Debt, Transaction } from '../types/creditManager';

interface CustomerStatementModalProps {
  customer: Customer;
  onClose: () => void;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  customer,
  onClose,
}) => {
  const { debts, transactions, config, userProfile } = useCreditManager();
  const printRef = useRef<HTMLDivElement>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const customerDebts = debts.filter((d) => d.customerId === customer.id);
  const customerTransactions = transactions.filter((t) => t.customerId === customer.id);

  const totalLya = customerDebts
    .filter((d) => d.type === 'lya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalAlya = customerDebts
    .filter((d) => d.type === 'alya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalPaid = customerTransactions.reduce((acc, tx) => acc + tx.amount, 0);
  const netDue = totalLya - totalAlya;

  const todayStr = new Date().toLocaleDateString('ar-MA');

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    exportCustomerStatementToExcel(
      customer,
      customerDebts,
      customerTransactions,
      config,
      userProfile
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-6 overflow-y-auto">
      {/* Action Bar (Hidden on print) */}
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 shadow-xl flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              كشف حساب الزبون: {customer.name}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              معاينة وطباعة وتصدير كشف الحساب التفصيلي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / حفظ PDF</span>
          </button>

          <button
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 rounded-xl hover:bg-teal-100 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-all shadow-xs active:scale-95"
            title="إرسال كشف الحساب بعبارات راقية وتفاصيل دقيقة عبر واتساب"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>إرسال عبر واتساب</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div
        ref={printRef}
        className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6 border border-slate-200 print:border-0 print:shadow-none print:p-0 print:m-0"
      >
        {/* Letterhead Header */}
        <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md overflow-hidden">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-7 h-7" />
              )}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                {userProfile.businessName || 'متجر الأمانة للتجارة'}
              </h1>
              <p className="text-xs text-slate-500">{userProfile.phone} • {userProfile.email}</p>
            </div>
          </div>

          <div className="text-end">
            <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-black rounded-lg">
              كشف حساب زبون تفصيلي
            </div>
            <div className="text-xs text-slate-500 mt-2 font-mono">
              التاريخ: {todayStr}
            </div>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">اسم الزبون:</span>
            <span className="font-bold text-slate-900 text-sm">{customer.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">رقم الهاتف:</span>
            <span className="font-bold text-slate-900 font-mono">{customer.phone}</span>
          </div>
          {customer.address && (
            <div className="sm:col-span-2">
              <span className="text-slate-500 block">العنوان:</span>
              <span className="font-semibold text-slate-800">{customer.address}</span>
            </div>
          )}
        </div>

        {/* Totals KPI */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <span className="text-[11px] font-bold text-indigo-700">إجمالي المبالغ المستحقة</span>
            <div className="text-base font-black text-indigo-950 mt-1">
              {formatCurrency(totalLya, config.currency, config.language)}
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <span className="text-[11px] font-bold text-emerald-700">مجموع المبالغ المسددة</span>
            <div className="text-base font-black text-emerald-950 mt-1">
              {formatCurrency(totalPaid, config.currency, config.language)}
            </div>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
            <span className="text-[11px] font-bold text-rose-700">الرصيد الصافي المتبقي</span>
            <div className="text-base font-black text-rose-950 mt-1">
              {formatCurrency(netDue, config.currency, config.language)}
            </div>
          </div>
        </div>

        {/* Debts Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-slate-800">تفاصيل البونات والديون المسجلة:</h3>
          <table className="w-full text-start text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 text-start">البيان / الصنف</th>
                <th className="py-2 px-3 text-start">التاريخ</th>
                <th className="py-2 px-3 text-end">المبلغ الأصلي</th>
                <th className="py-2 px-3 text-end">المؤدى</th>
                <th className="py-2 px-3 text-end">المتبقي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerDebts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    لا توجد ديون مسجلة
                  </td>
                </tr>
              ) : (
                customerDebts.map((d, i) => (
                  <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {d.category || 'دين عام'}
                    </td>
                    <td className="py-2 px-3 text-slate-500 font-mono">
                      {formatDate(d.date, config.language)}
                    </td>
                    <td className="py-2 px-3 text-end font-mono text-slate-600">
                      {formatCurrency(d.amount, config.currency, config.language)}
                    </td>
                    <td className="py-2 px-3 text-end font-mono text-emerald-600">
                      {formatCurrency(d.amount - d.remainingAmount, config.currency, config.language)}
                    </td>
                    <td className="py-2 px-3 text-end font-black font-mono text-indigo-700">
                      {formatCurrency(d.remainingAmount, config.currency, config.language)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
              <tr>
                <td colSpan={4} className="py-2.5 px-3 text-start">
                  صافي المبلغ المستحق للأداء:
                </td>
                <td className="py-2.5 px-3 text-end font-black text-rose-700 text-sm">
                  {formatCurrency(netDue, config.currency, config.language)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Transactions / Payments Table if any */}
        {customerTransactions.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-black text-slate-800">سجل الدفعات والإيصالات المستلمة:</h3>
            <table className="w-full text-start text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-start">رقم الإيصال</th>
                  <th className="py-2 px-3 text-start">تاريخ الأداء</th>
                  <th className="py-2 px-3 text-start">طريقة الدفع</th>
                  <th className="py-2 px-3 text-end">المبلغ المؤدى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerTransactions.map((tx, i) => (
                  <tr key={tx.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">
                      {tx.receiptNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-500 font-mono">
                      {formatDate(tx.paymentDate, config.language)}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{tx.paymentMethod}</td>
                    <td className="py-2 px-3 text-end font-bold font-mono text-emerald-600">
                      +{formatCurrency(tx.amount, config.currency, config.language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stamp and signature */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <span className="font-bold text-slate-600 block mb-10">توقيع الزبون:</span>
            <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
          </div>
          <div>
            <span className="font-bold text-slate-600 block mb-10">
              خاتم وتوقيع إدارة {userProfile.businessName || 'المتجر'}:
            </span>
            <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100">
          شكراً لتعاملكم معنا. لأي استفسار يرجى الاتصال على {userProfile.phone || ''}
        </div>
      </div>

      {/* WhatsApp Custom Statement Modal */}
      {isWhatsAppModalOpen && (
        <WhatsAppMessageModal
          customer={customer}
          initialTemplate="detailed_statement"
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}
    </div>
  );
};
