import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  FileSpreadsheet,
  FileText,
  Printer,
  Sparkles,
  Smartphone,
  Info,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate, getWhatsAppUrl } from '../utils/formatters';
import { exportFullReportToExcel } from '../utils/excelExport';

interface ShareReportModalProps {
  onClose: () => void;
  onOpenPrintModal: () => void;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  onClose,
  onOpenPrintModal,
}) => {
  const { customers, debts, transactions, config, userProfile } = useCreditManager();
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState('');
  const [shareNote, setShareNote] = useState('');

  const totalLya = debts
    .filter((d) => d.type === 'lya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalAlya = debts
    .filter((d) => d.type === 'alya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const netBalance = totalLya - totalAlya;
  const totalCollected = transactions.reduce((acc, tx) => acc + tx.amount, 0);
  const todayStr = new Date().toLocaleDateString('ar-MA');

  // Top 3 debtors for quick glance
  const topDebtors = customers
    .map((c) => {
      const sum = debts
        .filter((d) => d.customerId === c.id && d.type === 'lya')
        .reduce((a, b) => a + b.remainingAmount, 0);
      return { name: c.name, sum };
    })
    .filter((c) => c.sum > 0)
    .sort((a, b) => b.sum - a.sum)
    .slice(0, 3);

  // Formatted report text for sharing
  const formattedSummaryText = `📊 *تقرير الحسابات والديون - ${userProfile.businessName || 'متجر الأمانة'}*
📅 التاريخ: ${todayStr}
👤 التاجر: ${userProfile.name || 'المسؤول'}

💰 *الملخص المالي العام:*
• 🟢 إجمالي المستحقات (ليا): ${formatCurrency(totalLya, config.currency, config.language)}
• 🔴 إجمالي الواجبات (عليا): ${formatCurrency(totalAlya, config.currency, config.language)}
• ⚖️ صافي الرصيد: ${formatCurrency(netBalance, config.currency, config.language)}
• 💵 مجموع التحصيلات: ${formatCurrency(totalCollected, config.currency, config.language)}

👥 *الإحصائيات:*
• عدد الزبناء والموردين: ${customers.length}
• عدد الديون المفتوحة: ${debts.filter((d) => d.remainingAmount > 0).length}
${
  topDebtors.length > 0
    ? `\n🏆 *أبرز المستحقات (أكثر الزبناء):*\n` +
      topDebtors.map((d, i) => `${i + 1}. ${d.name}: ${formatCurrency(d.sum, config.currency, config.language)}`).join('\n')
    : ''
}
${shareNote ? `\n📝 *ملاحظة إضافية:* ${shareNote}\n` : ''}
──────────────
📌 تم إصدار هذا التقرير عبر تطبيق *Credit Manager*`;

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formattedSummaryText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = formattedSummaryText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `تقرير ديون ${userProfile.businessName || 'متجر الأمانة'}`,
          text: formattedSummaryText,
        });
      } catch (err) {
        // User cancelled or share failed
        console.log('Share dismissed or not supported');
      }
    } else {
      handleCopy();
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const phoneToUse = customPhone.trim() || '';
    const url = getWhatsAppUrl(phoneToUse, formattedSummaryText);
    window.open(url, '_blank');
  };

  // Share via Telegram
  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent('CreditManager')}&text=${encodeURIComponent(
      formattedSummaryText
    )}`;
    window.open(url, '_blank');
  };

  // Handle direct Excel export
  const handleExcelExport = () => {
    exportFullReportToExcel({
      customers,
      debts,
      transactions,
      config,
      userProfile,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Share2 className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">مشاركة وتصدير التقرير المالي</h2>
              <p className="text-xs text-indigo-200/80">
                شارك الملخص عبر واتساب، انسخ النص، أو صدّر كـ Excel و PDF
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 transition-all active:scale-95 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">واتساب</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">إرسال فوري</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleTelegramShare}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/60 text-sky-800 dark:text-sky-300 transition-all active:scale-95 group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">تيليجرام</span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400">مشاركة سريعة</span>
            </button>

            {/* Print / PDF Preview */}
            <button
              onClick={() => {
                onClose();
                onOpenPrintModal();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 transition-all active:scale-95 group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">تقرير PDF</span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400">معاينة وطباعة</span>
            </button>

            {/* Excel Export */}
            <button
              onClick={handleExcelExport}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/60 text-teal-800 dark:text-teal-300 transition-all active:scale-95 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">ملف Excel</span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400">جداول متعددة</span>
            </button>
          </div>

          {/* Optional Direct Phone for WhatsApp */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>إرسال لرقم هاتف محدد عبر واتساب (اختياري):</span>
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="مثال: 0612345678"
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
              <button
                onClick={handleWhatsAppShare}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>إرسال</span>
              </button>
            </div>
          </div>

          {/* Preview Box with Copy Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                نص الملخص الجاهز للمشاركة:
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                  copied
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ النص'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto select-all">
              {formattedSummaryText}
            </div>
          </div>

          {/* Additional note input */}
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              إضافة ملاحظة في نهاية التقرير (اختياري):
            </label>
            <input
              type="text"
              value={shareNote}
              onChange={(e) => setShareNote(e.target.value)}
              placeholder="مثال: يرجى مراجعة الحسابات قبل نهاية الشهر..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleNativeShare}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة سريعة</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
