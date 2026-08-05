import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  UserPlus,
  Receipt,
  CheckCircle2,
  Calendar,
  PhoneCall,
  DollarSign,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useCreditManager } from '../context/CreditManagerContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface DashboardProps {
  onOpenAddDebt: () => void;
  onOpenAddCustomer: () => void;
  onOpenRecordPayment: (debtId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAddDebt,
  onOpenAddCustomer,
  onOpenRecordPayment,
}) => {
  const { customers, debts, transactions, config, setActiveTab, setSelectedCustomerId } = useCreditManager();
  const t = getTranslation(config.language);

  // Calculations
  const totalLya = debts
    .filter((d) => d.type === 'lya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  const totalAlya = debts
    .filter((d) => d.type === 'alya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  const netBalance = totalLya - totalAlya;

  const overdueDebts = debts.filter((d) => d.status === 'overdue');
  const unpaidDebtsCount = debts.filter((d) => d.status !== 'paid').length;

  // Chart Data: Status Distribution
  const statusCounts = {
    unpaid: debts.filter((d) => d.status === 'unpaid').length,
    partial: debts.filter((d) => d.status === 'partial').length,
    paid: debts.filter((d) => d.status === 'paid').length,
    overdue: debts.filter((d) => d.status === 'overdue').length,
  };

  const pieData = [
    { name: t.unpaid, value: statusCounts.unpaid, color: '#f59e0b' },
    { name: t.partial, value: statusCounts.partial, color: '#3b82f6' },
    { name: t.paid, value: statusCounts.paid, color: '#10b981' },
    { name: t.overdue, value: statusCounts.overdue, color: '#ef4444' },
  ].filter((item) => item.value > 0);

  // Chart Data: Monthly Lya vs Alya mock aggregates
  const monthlyData = [
    { month: 'يناير', lya: 12000, alya: 5000 },
    { month: 'فبراير', lya: 15000, alya: 8000 },
    { month: 'مارس', lya: 18500, alya: 11000 },
    { month: 'أبريل', lya: 14000, alya: 7000 },
    { month: 'مايو', lya: 21000, alya: 12000 },
    { month: 'يونيو', lya: totalLya || 19500, alya: totalAlya || 9500 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Overdue Alert Banner if any overdue debts exist */}
      {overdueDebts.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-300 dark:border-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30 animate-soft-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                {t.overdueNotice}
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300/80">
                يوجد {overdueDebts.length} ديون متأخرة عن تاريخ الاستحقاق بـ{' '}
                {formatCurrency(
                  overdueDebts.reduce((acc, d) => acc + d.remainingAmount, 0),
                  config.currency,
                  config.language
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('debts')}
            className="px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-200 bg-white dark:bg-rose-950 rounded-xl border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900 transition-all shrink-0"
          >
            عرض الديون المتأخرة
          </button>
        </div>
      )}

      {/* Primary 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lya Card (لي) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 end-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.totalLya}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            {formatCurrency(totalLya, config.currency, config.language)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>مستحقة لي عند الزبناء</span>
          </div>
        </div>

        {/* Total Alya Card (عليا) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 end-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.totalAlya}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            {formatCurrency(totalAlya, config.currency, config.language)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>واجب عليّ أداؤها</span>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.netBalance}
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                netBalance >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold tracking-tight mb-2 ${
              netBalance >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(netBalance, config.currency, config.language)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {netBalance >= 0 ? 'صافي أرباح ومستحقات إيجابية' : 'عجز مؤقت في الرصيد الصافي'}
          </p>
        </div>

        {/* Customer Count & Active Debts Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t.totalCustomers}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            {customers.length} <span className="text-sm font-normal text-slate-500">زبون</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {unpaidDebtsCount} ديون جارية نُشطة
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Dial */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">إجراءات سريعة لمدير الديون</h2>
          <p className="text-xs text-indigo-200">سجل دينًا جديدًا، أضف زبونًا أو سجل عملية أداء بنقرة واحدة</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenAddDebt}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-indigo-900 hover:bg-indigo-50 shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addDebt}</span>
          </button>
          <button
            onClick={onOpenAddCustomer}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-700/80 hover:bg-indigo-700 text-white border border-indigo-500/30 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addCustomer}</span>
          </button>
          <button
            onClick={() => onOpenRecordPayment()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow transition-all active:scale-95"
          >
            <Receipt className="w-4 h-4" />
            <span>{t.recordPayment}</span>
          </button>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.monthlyOverview} (لي vs عليا)
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              عرض التفاصيل الكاملة <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), config.currency, config.language)}
                />
                <Bar dataKey="lya" name={t.lyaShort} fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="alya" name={t.alyaShort} fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Debt Status Distribution Pie Chart */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">توزيع حالات الديون</h3>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">لا توجد ديون مسجلة حالياً</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & Debtor Customers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payment Transactions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.recentActivity}
            </h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              عرض السجل
            </button>
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => {
              const cust = customers.find((c) => c.id === tx.customerId);
              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {cust?.name || 'زبون'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{tx.receiptNumber}</span>
                        <span>•</span>
                        <span>{formatDate(tx.paymentDate, config.language)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(tx.amount, config.currency, config.language)}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {tx.paymentMethod}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Customers with Debts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              الزبناء الأكثر مديونية
            </h3>
            <button
              onClick={() => setActiveTab('customers')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              جميع الزبناء
            </button>
          </div>
          <div className="space-y-3">
            {customers.slice(0, 5).map((cust) => {
              const custDebts = debts.filter((d) => d.customerId === cust.id);
              const custLyaTotal = custDebts
                .filter((d) => d.type === 'lya')
                .reduce((acc, d) => acc + d.remainingAmount, 0);

              return (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomerId(cust.id);
                  }}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        cust.photoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                      }
                      alt={cust.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {cust.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-slate-400" /> {cust.phone}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(custLyaTotal, config.currency, config.language)}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {custDebts.length} ديون
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
