import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  Share2,
  Filter,
  CheckCircle2,
  Building2,
  Calendar,
  Phone,
  Mail,
  User,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportFullReportToExcel } from '../utils/excelExport';

interface ReportPrintModalProps {
  onClose: () => void;
  onOpenShareModal: () => void;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  onClose,
  onOpenShareModal,
}) => {
  const { customers, debts, transactions, config, userProfile } = useCreditManager();
  const [reportFilter, setReportFilter] = useState<'all' | 'lya' | 'alya' | 'top_debtors'>('all');
  const printAreaRef = useRef<HTMLDivElement>(null);

  const totalLya = debts
    .filter((d) => d.type === 'lya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalAlya = debts
    .filter((d) => d.type === 'alya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const netBalance = totalLya - totalAlya;
  const totalCollected = transactions.reduce((acc, tx) => acc + tx.amount, 0);

  const filteredDebts = debts.filter((d) => {
    if (reportFilter === 'lya') return d.type === 'lya' && d.remainingAmount > 0;
    if (reportFilter === 'alya') return d.type === 'alya' && d.remainingAmount > 0;
    return d.remainingAmount > 0;
  });

  const customerDebtsSummary = customers
    .map((cust) => {
      const custDebts = debts.filter((d) => d.customerId === cust.id);
      const lyaSum = custDebts
        .filter((d) => d.type === 'lya')
        .reduce((acc, d) => acc + d.remainingAmount, 0);
      const alyaSum = custDebts
        .filter((d) => d.type === 'alya')
        .reduce((acc, d) => acc + d.remainingAmount, 0);
      return {
        customer: cust,
        lyaSum,
        alyaSum,
        debtCount: custDebts.length,
      };
    })
    .filter((c) => (reportFilter === 'top_debtors' ? c.lyaSum > 0 : true))
    .sort((a, b) => b.lyaSum - a.lyaSum);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportFullReportToExcel({
      customers,
      debts,
      transactions,
      config,
      userProfile,
    });
  };

  // Download standalone HTML report that can be opened/printed offline in any browser
  const handleDownloadHTML = () => {
    if (!printAreaRef.current) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير_الديون_${userProfile.businessName || 'المتجر'}_${new Date().toISOString().split('T')[0]}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; color: #0f172a; background: #fff; direction: rtl; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: start; }
    th { background-color: #f1f5f9; font-weight: bold; }
    .kpi-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  ${printAreaRef.current.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_${userProfile.businessName || 'المتجر'}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-start p-2 sm:p-6 overflow-y-auto">
      {/* Top Action & Control Bar (Hidden when printing) */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 shadow-xl flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              معاينة وطباعة تقرير PDF الشامل
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              تقرير رسمي جاهز للطباعة المباشرة أو الحفظ كملف PDF
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setReportFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              reportFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            تقرير شامل
          </button>
          <button
            onClick={() => setReportFilter('lya')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              reportFilter === 'lya'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            ديون ليا
          </button>
          <button
            onClick={() => setReportFilter('alya')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              reportFilter === 'alya'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            واجبات عليا
          </button>
          <button
            onClick={() => setReportFilter('top_debtors')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              reportFilter === 'top_debtors'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            أكثر المدينين
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all active:scale-95"
            title="طباعة أو حفظ كملف PDF"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / حفظ PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 rounded-xl hover:bg-teal-100 transition-all"
            title="تصدير بصيغة Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenShareModal();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-all"
            title="مشاركة"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard A4 layout) */}
      <div
        ref={printAreaRef}
        className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6 border border-slate-200 print:border-0 print:shadow-none print:p-0 print:m-0"
      >
        {/* Printable Document Header */}
        <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md overflow-hidden">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-8 h-8" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {userProfile.businessName || 'متجر الأمانة للتجارة'}
              </h1>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                <span className="flex items-center gap-1 font-semibold">
                  <User className="w-3.5 h-3.5 text-indigo-600" /> المسؤول: {userProfile.name}
                </span>
                {userProfile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {userProfile.phone}
                  </span>
                )}
                {userProfile.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {userProfile.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-end">
            <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-black rounded-lg">
              {reportFilter === 'all'
                ? 'تقرير الحسابات والديون العام'
                : reportFilter === 'lya'
                ? 'كشف ديون الزبناء (مستحقات ليا)'
                : reportFilter === 'alya'
                ? 'كشف واجبات الموردين (عليا)'
                : 'كشف أكثر الزبناء مديونية'}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center justify-end gap-1 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>تاريخ الإصدار: {new Date().toLocaleDateString('ar-MA')}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary Badges in Printout */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="text-[11px] font-bold text-indigo-700">إجمالي المستحقات (ليا)</div>
            <div className="text-base font-black text-indigo-950 mt-1">
              {formatCurrency(totalLya, config.currency, config.language)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
            <div className="text-[11px] font-bold text-amber-700">إجمالي الواجبات (عليا)</div>
            <div className="text-base font-black text-amber-950 mt-1">
              {formatCurrency(totalAlya, config.currency, config.language)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="text-[11px] font-bold text-emerald-700">صافي الرصيد المالي</div>
            <div className="text-base font-black text-emerald-950 mt-1">
              {formatCurrency(netBalance, config.currency, config.language)}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-600">مجموع التحصيلات</div>
            <div className="text-base font-black text-slate-900 mt-1">
              {formatCurrency(totalCollected, config.currency, config.language)}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {reportFilter === 'top_debtors'
                ? 'قائمة الزبناء الأكثر مديونية (ترتيب تنازلي)'
                : 'جدول تفاصيل الديون والعمليات'}
            </h3>
            <span className="text-[11px] text-slate-500 font-bold">
              العدد: {reportFilter === 'top_debtors' ? customerDebtsSummary.length : filteredDebts.length}
            </span>
          </div>

          <table className="w-full text-start text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              {reportFilter === 'top_debtors' ? (
                <tr>
                  <th className="py-2 px-3 text-start">#</th>
                  <th className="py-2 px-3 text-start">اسم الزبون</th>
                  <th className="py-2 px-3 text-start">رقم الهاتف</th>
                  <th className="py-2 px-3 text-start">عدد البونات</th>
                  <th className="py-2 px-3 text-end">إجمالي المستحق (ليا)</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-2 px-3 text-start">الطرف / الزبون</th>
                  <th className="py-2 px-3 text-start">النوع</th>
                  <th className="py-2 px-3 text-start">البيان</th>
                  <th className="py-2 px-3 text-start">التاريخ</th>
                  <th className="py-2 px-3 text-end">المبلغ الأصلي</th>
                  <th className="py-2 px-3 text-end">المتبقي</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportFilter === 'top_debtors' ? (
                customerDebtsSummary.map((item, index) => (
                  <tr key={item.customer.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="py-2 px-3 font-bold text-slate-400">{index + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{item.customer.name}</td>
                    <td className="py-2 px-3 text-slate-600 font-mono">{item.customer.phone}</td>
                    <td className="py-2 px-3 text-slate-600">{item.debtCount}</td>
                    <td className="py-2 px-3 text-end font-extrabold text-indigo-700">
                      {formatCurrency(item.lyaSum, config.currency, config.language)}
                    </td>
                  </tr>
                ))
              ) : filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    لا توجد بيانات مطابقة لهذا التصفية
                  </td>
                </tr>
              ) : (
                filteredDebts.map((d, index) => {
                  const cust = customers.find((c) => c.id === d.customerId);
                  return (
                    <tr key={d.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {cust?.name || 'غير محدد'}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.type === 'lya'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.type === 'lya' ? 'ليا (قبض)' : 'عليا (دفع)'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700">{d.category || 'دين عام'}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono">
                        {formatDate(d.date, config.language)}
                      </td>
                      <td className="py-2 px-3 text-end font-mono text-slate-600">
                        {formatCurrency(d.amount, config.currency, config.language)}
                      </td>
                      <td
                        className={`py-2 px-3 text-end font-extrabold font-mono ${
                          d.type === 'lya' ? 'text-indigo-700' : 'text-amber-700'
                        }`}
                      >
                        {formatCurrency(d.remainingAmount, config.currency, config.language)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Total Footer Row */}
            <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
              <tr>
                <td colSpan={reportFilter === 'top_debtors' ? 4 : 5} className="py-2.5 px-3 text-start">
                  المجموع الكلي للتقرير:
                </td>
                <td className="py-2.5 px-3 text-end font-black text-slate-900 text-sm">
                  {reportFilter === 'top_debtors' || reportFilter === 'lya'
                    ? formatCurrency(totalLya, config.currency, config.language)
                    : reportFilter === 'alya'
                    ? formatCurrency(totalAlya, config.currency, config.language)
                    : formatCurrency(netBalance, config.currency, config.language)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Official Signature and Stamp Box */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <span className="font-bold text-slate-600 block mb-12">توقيع المستلم / الزبون:</span>
            <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
          </div>
          <div>
            <span className="font-bold text-slate-600 block mb-12">
              خاتم وتوقيع إدارة {userProfile.businessName || 'المتجر'}:
            </span>
            <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
          </div>
        </div>

        {/* Document Footer */}
        <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span>تم إنشاء وتوثيق هذا المستند عبر نظام Credit Manager لإدارة الديون والحسابات</span>
          <span>صفحة 1 من 1</span>
        </div>
      </div>
    </div>
  );
};
