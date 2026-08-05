import React, { useState } from 'react';
import { History, Search, Printer, Trash2, CheckCircle2, Receipt, Calendar, CreditCard } from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { Transaction } from '../types/creditManager';

export const TransactionsList: React.FC = () => {
  const { transactions, customers, debts, config, deleteTransaction, userProfile } = useCreditManager();
  const t = getTranslation(config.language);

  const [search, setSearch] = useState('');
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);

  const filteredTxs = transactions.filter((tx) => {
    const cust = customers.find((c) => c.id === tx.customerId);
    const searchLower = search.toLowerCase();
    return (
      tx.receiptNumber.toLowerCase().includes(searchLower) ||
      (cust && cust.name.toLowerCase().includes(searchLower)) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchLower)) ||
      tx.amount.toString().includes(search)
    );
  });

  const handlePrintReceipt = (tx: Transaction) => {
    setSelectedTxForReceipt(tx);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/80 rounded-xl text-emerald-600 dark:text-emerald-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.transactions} ({filteredTxs.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              سجل كافة الدفعات وعمليات الأداء مع خيار طباعة وتصدير الإيصالات
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث برقم الإيصال، اسم الزبون، المبلغ..."
          className="w-full ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
        />
      </div>

      {/* Transactions Table / List */}
      {filteredTxs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
            لا توجد عمليات أداء مسجلة
          </h3>
          <p className="text-xs text-slate-400">أي عملية أداء جديدة تسجلها ستظهر في هذا السجل</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTxs.map((tx) => {
            const cust = customers.find((c) => c.id === tx.customerId);
            const debt = debts.find((d) => d.id === tx.debtId);

            return (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {tx.receiptNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {tx.paymentMethod}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      الزبون: {cust?.name || 'زبون'}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{formatDate(tx.paymentDate, config.language)}</span>
                      {debt?.category && <span>• {debt.category}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                  <div className="text-start sm:text-end">
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(tx.amount, config.currency, config.language)}
                    </div>
                    {tx.notes && <div className="text-[10px] text-slate-400">{tx.notes}</div>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePrintReceipt(tx)}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all"
                      title={t.print}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t.confirmDelete)) deleteTransaction(tx.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      title={t.confirmDelete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Receipt Modal Overlay for direct browser printing */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 print-shadow-none">
            {/* Business Header */}
            <div className="text-center border-b pb-4 border-slate-200">
              <h1 className="text-lg font-extrabold text-indigo-900">{userProfile.businessName}</h1>
              <p className="text-xs text-slate-500">{userProfile.phone} • {userProfile.email}</p>
              <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mt-2">
                إيصال أداء أمانة #{selectedTxForReceipt.receiptNumber}
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">اسم الزبون:</span>
                <span className="font-bold">
                  {customers.find((c) => c.id === selectedTxForReceipt.customerId)?.name}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">تاريخ الأداء:</span>
                <span className="font-bold">{formatDate(selectedTxForReceipt.paymentDate, config.language)}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="font-bold">{selectedTxForReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-500">المبلغ المؤدى:</span>
                <span className="font-extrabold text-emerald-600 text-sm">
                  {formatCurrency(selectedTxForReceipt.amount, config.currency, config.language)}
                </span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="text-center pt-4 border-t border-slate-200 text-[10px] text-slate-400">
              شكراً لتعاملكم مع {userProfile.businessName}. هذا الإيصال تم إصداره عبر Credit Manager.
            </div>

            <div className="flex justify-end gap-2 no-print pt-2">
              <button
                onClick={() => setSelectedTxForReceipt(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-200 text-slate-800 rounded-xl"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl"
              >
                طباعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
