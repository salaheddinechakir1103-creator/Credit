import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  FileText,
  CreditCard,
  Edit2,
  Trash2,
  Eye,
  Plus,
  Receipt,
  MoreVertical,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, getWhatsAppUrl, getCallUrl, getSmsUrl } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { Customer } from '../types/creditManager';

interface CustomerListProps {
  onOpenAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onOpenAddDebtForCustomer: (customerId: string) => void;
  onOpenRecordPaymentForCustomer: (customerId: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onOpenAddCustomer,
  onEditCustomer,
  onOpenAddDebtForCustomer,
  onOpenRecordPaymentForCustomer,
}) => {
  const { customers, debts, config, searchQuery, setSearchQuery, setSelectedCustomerId, deleteCustomer } =
    useCreditManager();
  const t = getTranslation(config.language);

  const [filterType, setFilterType] = useState<'all' | 'debtors' | 'creditors'>('all');

  // Filter customers based on search query and filterType
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.phone.includes(searchQuery) ||
      (cust.address && cust.address.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const custDebts = debts.filter((d) => d.customerId === cust.id);
    const lyaSum = custDebts.filter((d) => d.type === 'lya').reduce((acc, d) => acc + d.remainingAmount, 0);
    const alyaSum = custDebts.filter((d) => d.type === 'alya').reduce((acc, d) => acc + d.remainingAmount, 0);

    if (filterType === 'debtors') return lyaSum > 0;
    if (filterType === 'creditors') return alyaSum > 0;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Search / Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.customers} ({filteredCustomers.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              إدارة الزبناء والموردين، التواصل المباشر وتتبع ديونهم
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddCustomer}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addCustomer}</span>
        </button>
      </div>

      {/* Search & Tabs filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchCustomer}
            className="w-full ps-9 pe-4 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            الكل ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('debtors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'debtors'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            مدينون لي (ليا)
          </button>
          <button
            onClick={() => setFilterType('creditors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'creditors'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            موردون (عليا)
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <UserPlus className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t.noCustomers}
          </h3>
          <p className="text-xs text-slate-400 mb-4">أضف زبوناً جديداً لبدء تسجيل ديونه ومعاملاته</p>
          <button
            onClick={onOpenAddCustomer}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all"
          >
            {t.addCustomer}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const custDebts = debts.filter((d) => d.customerId === cust.id);
            const lyaTotal = custDebts
              .filter((d) => d.type === 'lya')
              .reduce((acc, d) => acc + d.remainingAmount, 0);
            const alyaTotal = custDebts
              .filter((d) => d.type === 'alya')
              .reduce((acc, d) => acc + d.remainingAmount, 0);

            const whatsappMessage = t.whatsappReminder(
              cust.name,
              formatCurrency(lyaTotal, config.currency, config.language),
              config.currency,
              'تاريخ اليوم'
            );

            return (
              <div
                key={cust.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          cust.photoUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                        }
                        alt={cust.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {cust.name}
                        </h3>
                        {cust.address && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[150px]">{cust.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditCustomer(cust)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        title={t.editCustomer}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t.confirmDelete)) deleteCustomer(cust.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        title={t.deleteCustomer}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Financial Metrics Badges */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-4">
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{t.lyaShort}</div>
                      <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(lyaTotal, config.currency, config.language)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{t.alyaShort}</div>
                      <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                        {formatCurrency(alyaTotal, config.currency, config.language)}
                      </div>
                    </div>
                  </div>

                  {/* Contact Buttons bar (Call, WhatsApp, SMS) */}
                  <div className="flex items-center gap-2 mb-4">
                    <a
                      href={getCallUrl(cust.phone)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all"
                      title={t.call}
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t.call}</span>
                    </a>
                    <a
                      href={getWhatsAppUrl(cust.phone, whatsappMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 rounded-lg transition-all"
                      title={t.whatsapp}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t.whatsapp}</span>
                    </a>
                    <a
                      href={getSmsUrl(cust.phone)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all"
                      title={t.sms}
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.sms}</span>
                    </a>
                  </div>
                </div>

                {/* Bottom View Details & Add Debt / Payment Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl hover:bg-indigo-100 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t.customerDetails}</span>
                  </button>

                  <button
                    onClick={() => onOpenAddDebtForCustomer(cust.id)}
                    className="p-2 text-indigo-600 dark:text-indigo-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-xl transition-all"
                    title={t.addDebt}
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenRecordPaymentForCustomer(cust.id)}
                    className="p-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl transition-all"
                    title={t.recordPayment}
                  >
                    <Receipt className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
