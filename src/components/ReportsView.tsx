import React, { useState } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Share2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Award,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { exportFullReportToExcel } from '../utils/excelExport';
import { ReportPrintModal } from './ReportPrintModal';
import { ShareReportModal } from './ShareReportModal';

export const ReportsView: React.FC = () => {
  const { customers, debts, transactions, config, userProfile, setSelectedCustomerId } =
    useCreditManager();
  const t = getTranslation(config.language);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [excelExportSuccess, setExcelExportSuccess] = useState(false);

  const totalLya = debts
    .filter((d) => d.type === 'lya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  const totalAlya = debts
    .filter((d) => d.type === 'alya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  const netBalance = totalLya - totalAlya;
  const totalCollected = transactions.reduce((acc, tx) => acc + tx.amount, 0);

  // Top Debtors Ranking
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
    .sort((a, b) => b.lyaSum - a.lyaSum);

  // Export to Multi-sheet genuine Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      exportFullReportToExcel({
        customers,
        debts,
        transactions,
        config,
        userProfile,
      });
      setExcelExportSuccess(true);
      setTimeout(() => setExcelExportSuccess(false), 3000);
    } catch (err) {
      console.error('Excel Export Error:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.reports}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تقارير الديون والأرباح، الأكثر مديونية وتصدير البيانات ومشاركتها
            </p>
          </div>
        </div>

        {/* Action Buttons: PDF, Excel, Share */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
            title="معاينة وطباعة وحفظ تقرير PDF عالي الجودة"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>{t.exportPdf} / طباعة</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-all shadow-sm active:scale-95"
            title="تصدير ملف إكسيل (.xlsx) يحتوي على عدة أوراق مفصلة"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>{t.exportExcel} (.xlsx)</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow active:scale-95"
            title="مشاركة التقرير عبر واتساب وتيليجرام ووسائل التواصل"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareReport}</span>
          </button>
        </div>
      </div>

      {/* Success Notification for Excel Export */}
      {excelExportSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-bold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم تجهيز وتحميل ملف Excel (.xlsx) بنجاح مع كافة الجداول والأوراق المفصلة!</span>
          </div>
          <button
            onClick={() => setExcelExportSuccess(false)}
            className="text-emerald-600 hover:text-emerald-800 font-normal"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{t.totalLya}</span>
            <ArrowDownLeft className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {formatCurrency(totalLya, config.currency, config.language)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">مستحقات واجبة القبض من الزبناء</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{t.totalAlya}</span>
            <ArrowUpRight className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(totalAlya, config.currency, config.language)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ديون وواجبات للموردين</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{t.netBalance}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div
            className={`text-xl font-black ${
              netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}
          >
            {formatCurrency(netBalance, config.currency, config.language)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">الفارق بين ليا وعليا</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>مجموع التحصيلات</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalCollected, config.currency, config.language)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">إجمالي ما تم استخلاصه في الصندوق</div>
        </div>
      </div>

      {/* Top Debtor Customers Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              أكثر الزبناء مديونية (ترتيب تنازلي)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            إجمالي المدينين: {customerDebtsSummary.filter((c) => c.lyaSum > 0).length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-3 px-3 text-start">الترتيب</th>
                <th className="py-3 px-3 text-start">اسم الزبون</th>
                <th className="py-3 px-3 text-start">رقم الهاتف</th>
                <th className="py-3 px-3 text-start">عدد البونات</th>
                <th className="py-3 px-3 text-end">إجمالي المستحق (ليا)</th>
                <th className="py-3 px-3 text-end">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customerDebtsSummary.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    لا توجد بيانات زبناء مسجلة حالياً
                  </td>
                </tr>
              ) : (
                customerDebtsSummary.map((item, index) => (
                  <tr key={item.customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-3 font-bold text-slate-400">#{index + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <img
                        src={
                          item.customer.photoUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                        }
                        alt={item.customer.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span>{item.customer.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{item.customer.phone}</td>
                    <td className="py-3 px-3 text-slate-500">{item.debtCount}</td>
                    <td className="py-3 px-3 text-end font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                      {formatCurrency(item.lyaSum, config.currency, config.language)}
                    </td>
                    <td className="py-3 px-3 text-end">
                      <button
                        onClick={() => setSelectedCustomerId(item.customer.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-100 transition-all"
                      >
                        كشف الحساب
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Print Modal */}
      {isPrintModalOpen && (
        <ReportPrintModal
          onClose={() => setIsPrintModalOpen(false)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />
      )}

      {/* Share Report Modal */}
      {isShareModalOpen && (
        <ShareReportModal
          onClose={() => setIsShareModalOpen(false)}
          onOpenPrintModal={() => setIsPrintModalOpen(true)}
        />
      )}
    </div>
  );
};
