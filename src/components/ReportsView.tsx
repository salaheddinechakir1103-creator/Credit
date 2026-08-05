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
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

export const ReportsView: React.FC = () => {
  const { customers, debts, transactions, config, userProfile } = useCreditManager();
  const t = getTranslation(config.language);

  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

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
      return {
        customer: cust,
        lyaSum,
        debtCount: custDebts.length,
      };
    })
    .sort((a, b) => b.lyaSum - a.lyaSum);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const headers = ['اسم الزبون', 'رقم الهاتف', 'العنوان', 'إجمالي الدين (ليا)', 'إجمالي الواجب (عليا)', 'تاريخ التقرير'];
    const rows = customers.map((c) => {
      const cDebts = debts.filter((d) => d.customerId === c.id);
      const lya = cDebts.filter((d) => d.type === 'lya').reduce((a, b) => a + b.remainingAmount, 0);
      const alya = cDebts.filter((d) => d.type === 'alya').reduce((a, b) => a + b.remainingAmount, 0);
      return [c.name, c.phone, c.address || '', lya, alya, new Date().toLocaleDateString('ar-MA')];
    });

    exportToCSV(`CreditManager_Report_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Credit Manager - ${userProfile.businessName}`, 14, 20);

    doc.setFontSize(12);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Receivable (Lya): ${totalLya} ${config.currency}`, 14, 40);
    doc.text(`Total Payable (Alya): ${totalAlya} ${config.currency}`, 14, 48);
    doc.text(`Net Balance: ${netBalance} ${config.currency}`, 14, 56);
    doc.text(`Total Payments Collected: ${totalCollected} ${config.currency}`, 14, 64);

    doc.setFontSize(14);
    doc.text('Top Debtor Customers:', 14, 80);

    let y = 90;
    customerDebtsSummary.slice(0, 10).forEach((item, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(
        `${idx + 1}. ${item.customer.name} (${item.customer.phone}) - ${item.lyaSum} ${config.currency}`,
        14,
        y
      );
      y += 8;
    });

    doc.save(`CreditManager_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Share report text
  const handleShareReport = async () => {
    const text = `📊 تقرير ${userProfile.businessName} - Credit Manager\n• إجمالي المستحقات (ليا): ${formatCurrency(totalLya, config.currency, config.language)}\n• إجمالي الواجبات (عليا): ${formatCurrency(totalAlya, config.currency, config.language)}\n• صافي الرصيد: ${formatCurrency(netBalance, config.currency, config.language)}\n• تاريخ التقرير: ${new Date().toLocaleDateString('ar-MA')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تقرير الديون والمالية',
          text,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('تم نسخ ملخص التقرير إلى الحافظة بنجاح!');
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
              تقارير الديون والأرباح، الأكثر مديونية وتصدير البيانات
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-all"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>{t.exportPdf}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={handleShareReport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.shareReport}</span>
          </button>
        </div>
      </div>

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t.totalLya}</div>
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(totalLya, config.currency, config.language)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t.totalAlya}</div>
          <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
            {formatCurrency(totalAlya, config.currency, config.language)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t.netBalance}</div>
          <div
            className={`text-xl font-extrabold ${
              netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(netBalance, config.currency, config.language)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">مجموع التحصيلات</div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalCollected, config.currency, config.language)}
          </div>
        </div>
      </div>

      {/* Top Debtor Customers Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">أكثر الزبناء مديونية</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-3 px-3 text-start">الترتيب</th>
                <th className="py-3 px-3 text-start">اسم الزبون</th>
                <th className="py-3 px-3 text-start">رقم الهاتف</th>
                <th className="py-3 px-3 text-start">عدد الديون</th>
                <th className="py-3 px-3 text-end">إجمالي المستحق (ليا)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customerDebtsSummary.map((item, index) => (
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
                  <td className="py-3 px-3 text-slate-500">{item.customer.phone}</td>
                  <td className="py-3 px-3 text-slate-500">{item.debtCount}</td>
                  <td className="py-3 px-3 text-end font-extrabold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(item.lyaSum, config.currency, config.language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
