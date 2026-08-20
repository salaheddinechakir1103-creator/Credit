import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  FileText,
  MapPin,
  CreditCard,
  Plus,
  Receipt,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  User,
  Printer,
  FileSpreadsheet,
  Share2,
  ShoppingBag,
  Eye,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate, getWhatsAppUrl, getCallUrl, getSmsUrl } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { exportCustomerStatementToExcel } from '../utils/excelExport';
import { CustomerStatementModal } from './CustomerStatementModal';
import { WhatsAppMessageModal } from './WhatsAppMessageModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { Invoice } from '../types/creditManager';

interface CustomerDetailModalProps {
  onClose: () => void;
  onOpenAddDebtForCustomer: (customerId: string) => void;
  onOpenCreateInvoiceForCustomer?: (customerId: string) => void;
  onOpenRecordPayment: (debtId?: string, customerId?: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  onClose,
  onOpenAddDebtForCustomer,
  onOpenCreateInvoiceForCustomer,
  onOpenRecordPayment,
}) => {
  const { customers, debts, transactions, invoices, selectedCustomerId, consolidateCustomerDebts, config, userProfile } = useCreditManager();
  const t = getTranslation(config.language);

  const [activeSubTab, setActiveSubTab] = useState<'debts' | 'transactions' | 'invoices'>('debts');
  const [isConsolidating, setIsConsolidating] = useState<boolean>(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState<boolean>(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [selectedInvoiceToView, setSelectedInvoiceToView] = useState<Invoice | null>(null);

  const customer = customers.find((c) => c.id === selectedCustomerId);
  if (!customer) return null;

  const custDebts = debts.filter((d) => d.customerId === customer.id);
  const activeUnpaidDebts = custDebts.filter((d) => d.remainingAmount > 0);
  const custTransactions = transactions.filter((t) => t.customerId === customer.id);
  const custInvoices = invoices.filter((inv) => inv.customerId === customer.id);

  const totalLya = custDebts.filter((d) => d.type === 'lya').reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalAlya = custDebts.filter((d) => d.type === 'alya').reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalPaid = custTransactions.reduce((acc, tx) => acc + tx.amount, 0);

  const handleConsolidate = async () => {
    setIsConsolidating(true);
    await consolidateCustomerDebts(customer.id);
    setIsConsolidating(false);
  };

  const handleExportExcel = () => {
    exportCustomerStatementToExcel(customer, custDebts, custTransactions, config, userProfile);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={
                customer.photoUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
              }
              alt={customer.name}
              className="w-14 h-14 rounded-full object-cover ring-4 ring-indigo-500/30"
            />
            <div>
              <h2 className="text-lg font-bold">{customer.name}</h2>
              <div className="flex items-center gap-3 text-xs text-indigo-200 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {customer.phone}
                </span>
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Bar (Call, WhatsApp, SMS, Add Debt, Add Payment, Consolidate, Create Invoice) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a
              href={getCallUrl(customer.phone)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.call}</span>
            </a>
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl hover:bg-emerald-200 transition-all shadow-xs active:scale-95"
              title="إرسال رسالة وكشف حساب مفصل ومهذب عبر واتساب"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.whatsapp}</span>
            </button>
            <a
              href={getSmsUrl(customer.phone)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>{t.sms}</span>
            </a>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsStatementModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              title="معاينة وطباعة كشف الحساب كـ PDF"
            >
              <Printer className="w-3.5 h-3.5 text-rose-500" />
              <span>كشف PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 rounded-xl hover:bg-teal-100 transition-all"
              title="تصدير كشف حساب الزبون كـ Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
              <span>Excel</span>
            </button>

            {onOpenCreateInvoiceForCustomer && (
              <button
                onClick={() => onOpenCreateInvoiceForCustomer(customer.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 transition-all"
                title="إنشاء فاتورة وزيادة الدين تلقائياً"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                <span>+ فاتورة</span>
              </button>
            )}

            {activeUnpaidDebts.length > 1 && (
              <button
                onClick={handleConsolidate}
                disabled={isConsolidating}
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-all"
                title="دمج كل البونات القديمة والجديدة في بون إجمالي واحد"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>دمج ({activeUnpaidDebts.length})</span>
              </button>
            )}

            {(totalLya > 0 || totalAlya > 0) && (
              <button
                onClick={() => onOpenRecordPayment(undefined, customer.id)}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm transition-all"
              >
                <Receipt className="w-4 h-4" />
                <span>أداء</span>
              </button>
            )}

            <button
              onClick={() => onOpenAddDebtForCustomer(customer.id)}
              className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addDebt}</span>
            </button>
          </div>
        </div>

        {/* Customer Totals Summary Cards */}
        <div className="p-6 grid grid-cols-3 gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 text-center">
            <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              {t.totalLya}
            </div>
            <div className="text-base font-extrabold text-indigo-900 dark:text-indigo-200 mt-1">
              {formatCurrency(totalLya, config.currency, config.language)}
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-center">
            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              {t.totalAlya}
            </div>
            <div className="text-base font-extrabold text-amber-900 dark:text-amber-200 mt-1">
              {formatCurrency(totalAlya, config.currency, config.language)}
            </div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-center">
            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              مجموع المسدد
            </div>
            <div className="text-base font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">
              {formatCurrency(totalPaid, config.currency, config.language)}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 flex border-b border-slate-200 dark:border-slate-800 gap-6">
          <button
            onClick={() => setActiveSubTab('debts')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'debts'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.customerDebts} ({custDebts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'invoices'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            الفواتير والمبيعات ({custInvoices.length})
          </button>
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'transactions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.customerTransactions} ({custTransactions.length})
          </button>
        </div>

        {/* Sub-tab Content */}
        <div className="p-6 max-h-80 overflow-y-auto space-y-3">
          {activeSubTab === 'debts' ? (
            custDebts.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">لا توجد ديون مسجلة لهذه الزبون</p>
            ) : (
              custDebts.map((d) => (
                <div
                  key={d.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.type === 'lya'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {d.type === 'lya' ? t.lyaShort : t.alyaShort}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {d.category || 'دين عام'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-1">
                      <span>تاريخ النشأة: {formatDate(d.date, config.language)}</span>
                      <span>•</span>
                      <span>الاستحقاق: {formatDate(d.dueDate, config.language)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(d.remainingAmount, config.currency, config.language)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        من أصل {formatCurrency(d.amount, config.currency, config.language)}
                      </div>
                    </div>

                    {d.remainingAmount > 0 && (
                      <button
                        onClick={() => onOpenRecordPayment(d.id, customer.id)}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all"
                      >
                        أداء
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          ) : activeSubTab === 'invoices' ? (
            custInvoices.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400 mb-3">لا توجد فواتير منشأة لهذا الزبون حتى الآن</p>
                {onOpenCreateInvoiceForCustomer && (
                  <button
                    onClick={() => onOpenCreateInvoiceForCustomer(customer.id)}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all"
                  >
                    + إنشاء أول فاتورة الآن
                  </button>
                )}
              </div>
            ) : (
              custInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        #{inv.invoiceNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentType === 'cash'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : inv.paymentType === 'partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {inv.paymentType === 'cash'
                          ? 'كاش نقدي'
                          : inv.paymentType === 'partial'
                          ? 'تسبيق + كريدي'
                          : 'كريدي'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{formatDate(inv.date, config.language)}</span>
                      <span>•</span>
                      <span>{inv.items.length} أصناف</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(inv.totalAmount, config.currency, config.language)}
                      </div>
                      {inv.remainingAmount > 0 && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                          باقي كريدي: {formatCurrency(inv.remainingAmount, config.currency, config.language)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedInvoiceToView(inv)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors"
                      title="عرض وطباعة الفاتورة"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : custTransactions.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">لا يوجد سجل عمليات أداء حالياً</p>
          ) : (
            custTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      إيصال {tx.receiptNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {formatDate(tx.paymentDate, config.language)} ({tx.paymentMethod})
                    </div>
                  </div>
                </div>

                <div className="text-xs font-extrabold text-emerald-600">
                  +{formatCurrency(tx.amount, config.currency, config.language)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Customer Statement Modal (PDF / Print / Share / Excel) */}
      {isStatementModalOpen && (
        <CustomerStatementModal
          customer={customer}
          onClose={() => setIsStatementModalOpen(false)}
        />
      )}

      {/* Invoice Detail Modal when clicked from inside customer modal */}
      {selectedInvoiceToView && (
        <InvoiceDetailModal
          invoice={selectedInvoiceToView}
          onClose={() => setSelectedInvoiceToView(null)}
        />
      )}

      {/* WhatsApp Message Modal */}
      {isWhatsAppModalOpen && (
        <WhatsAppMessageModal
          customer={customer}
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}
    </div>
  );
};
