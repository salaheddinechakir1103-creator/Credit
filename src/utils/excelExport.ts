import * as XLSX from 'xlsx';
import { Customer, Debt, Transaction, AppConfig, UserProfile } from '../types/creditManager';
import { formatCurrency, formatDate } from './formatters';

export interface FullReportData {
  customers: Customer[];
  debts: Debt[];
  transactions: Transaction[];
  config: AppConfig;
  userProfile: UserProfile;
}

/**
 * Export full financial data to a comprehensive multi-sheet Excel (.xlsx) file
 */
export const exportFullReportToExcel = (data: FullReportData) => {
  const { customers, debts, transactions, config, userProfile } = data;
  const currency = config.currency || 'MAD';
  const todayStr = new Date().toLocaleDateString('ar-MA');

  const totalLya = debts
    .filter((d) => d.type === 'lya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalAlya = debts
    .filter((d) => d.type === 'alya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const netBalance = totalLya - totalAlya;
  const totalCollected = transactions.reduce((acc, tx) => acc + tx.amount, 0);

  const wb = XLSX.utils.book_new();

  // ----------------------------------------------------
  // Sheet 1: Financial Summary (الملخص المالي العام)
  // ----------------------------------------------------
  const summaryRows = [
    ['تقرير الحسابات والديون الشامل', ''],
    ['اسم المتجر / النشاط:', userProfile.businessName || 'متجر الأمانة'],
    ['صاحب المتجر:', userProfile.name || 'التاجر'],
    ['رقم الهاتف:', userProfile.phone || ''],
    ['تاريخ التقرير:', todayStr],
    ['العملة المعتمدة:', currency],
    ['', ''],
    ['المؤشر المالي', 'المبلغ'],
    ['إجمالي المستحقات للقبض (ليا)', totalLya],
    ['إجمالي الواجبات للدفع (عليا)', totalAlya],
    ['صافي الرصيد المالي', netBalance],
    ['مجموع المبالغ المحصلة', totalCollected],
    ['', ''],
    ['إحصائيات عامة', 'العدد'],
    ['عدد الزبناء والموردين الكلي', customers.length],
    ['عدد سجلات الديون المفتوحة', debts.filter((d) => d.remainingAmount > 0).length],
    ['عدد عمليات وسندات الأداء', transactions.length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 25 }];
  wsSummary['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص المالي العام');

  // ----------------------------------------------------
  // Sheet 2: Customer Debts - Lya (ديون الزبناء - ليا)
  // ----------------------------------------------------
  const lyaDebts = debts.filter((d) => d.type === 'lya');
  const lyaHeader = [
    'اسم الزبون',
    'رقم الهاتف',
    'العنوان',
    'بيان / صنف الدين',
    'المبلغ الأصلي',
    'المبلغ المؤدى',
    'المتبقي للقبض (ليا)',
    'العملة',
    'تاريخ التسجيل',
    'تاريخ الاستحقاق',
    'الحالة',
    'ملاحظات',
  ];

  const lyaRows = lyaDebts.map((d) => {
    const cust = customers.find((c) => c.id === d.customerId);
    const paid = d.amount - d.remainingAmount;
    const status =
      d.remainingAmount === 0
        ? 'مسدد بالكامل'
        : paid > 0
        ? 'مسدد جزئياً'
        : 'غير مسدد';
    return [
      cust?.name || 'غير محدد',
      cust?.phone || '',
      cust?.address || '',
      d.category || 'دين عام',
      d.amount,
      paid,
      d.remainingAmount,
      currency,
      d.date ? d.date.split('T')[0] : '',
      d.dueDate ? d.dueDate.split('T')[0] : '',
      status,
      d.notes || '',
    ];
  });

  const wsLya = XLSX.utils.aoa_to_sheet([lyaHeader, ...lyaRows]);
  wsLya['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
  ];
  wsLya['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsLya, 'مستحقات الزبناء (ليا)');

  // ----------------------------------------------------
  // Sheet 3: Supplier Debts - Alya (واجبات الموردين - عليا)
  // ----------------------------------------------------
  const alyaDebts = debts.filter((d) => d.type === 'alya');
  const alyaHeader = [
    'اسم المورد / الدائن',
    'رقم الهاتف',
    'العنوان',
    'بيان الواجب',
    'المبلغ الأصلي',
    'المبلغ المؤدى',
    'المتبقي للدفع (عليا)',
    'العملة',
    'تاريخ التسجيل',
    'تاريخ الاستحقاق',
    'الحالة',
    'ملاحظات',
  ];

  const alyaRows = alyaDebts.map((d) => {
    const cust = customers.find((c) => c.id === d.customerId);
    const paid = d.amount - d.remainingAmount;
    const status =
      d.remainingAmount === 0
        ? 'مسدد بالكامل'
        : paid > 0
        ? 'مسدد جزئياً'
        : 'غير مسدد';
    return [
      cust?.name || 'غير محدد',
      cust?.phone || '',
      cust?.address || '',
      d.category || 'بضاعة / مورد',
      d.amount,
      paid,
      d.remainingAmount,
      currency,
      d.date ? d.date.split('T')[0] : '',
      d.dueDate ? d.dueDate.split('T')[0] : '',
      status,
      d.notes || '',
    ];
  });

  const wsAlya = XLSX.utils.aoa_to_sheet([alyaHeader, ...alyaRows]);
  wsAlya['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
  ];
  wsAlya['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsAlya, 'واجبات الموردين (عليا)');

  // ----------------------------------------------------
  // Sheet 4: Customers Summary (كشف أرصدة كل الزبناء)
  // ----------------------------------------------------
  const custHeader = [
    'اسم الزبون / المورد',
    'رقم الهاتف',
    'العنوان',
    'عدد الديون',
    'إجمالي المستحق (ليا)',
    'إجمالي الواجب (عليا)',
    'صافي الرصيد',
    'العملة',
  ];

  const custRows = customers.map((c) => {
    const cDebts = debts.filter((d) => d.customerId === c.id);
    const lya = cDebts
      .filter((d) => d.type === 'lya')
      .reduce((a, b) => a + b.remainingAmount, 0);
    const alya = cDebts
      .filter((d) => d.type === 'alya')
      .reduce((a, b) => a + b.remainingAmount, 0);
    return [c.name, c.phone, c.address || '', cDebts.length, lya, alya, lya - alya, currency];
  });

  const wsCustomers = XLSX.utils.aoa_to_sheet([custHeader, ...custRows]);
  wsCustomers['!cols'] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 20 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
  ];
  wsCustomers['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'أرصدة الزبناء والموردين');

  // ----------------------------------------------------
  // Sheet 5: Transactions History (سجل عمليات الأداء)
  // ----------------------------------------------------
  const txHeader = [
    'رقم الإيصال',
    'اسم الزبون / المورد',
    'المبلغ المؤدى',
    'العملة',
    'طريقة الدفع',
    'تاريخ الأداء',
    'ملاحظات',
  ];

  const txRows = transactions.map((t) => {
    const cust = customers.find((c) => c.id === t.customerId);
    return [
      t.receiptNumber,
      cust?.name || 'غير محدد',
      t.amount,
      currency,
      t.paymentMethod || 'نقداً',
      t.paymentDate ? t.paymentDate.split('T')[0] : '',
      t.notes || '',
    ];
  });

  const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txRows]);
  wsTx['!cols'] = [
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 },
    { wch: 25 },
  ];
  wsTx['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsTx, 'سجل الدفعات والتحصيلات');

  // Write and trigger download
  const dateTag = new Date().toISOString().split('T')[0];
  const safeBusinessName = (userProfile.businessName || 'CreditManager').replace(/[\/\\?%*:|"<>]/g, '_');
  XLSX.writeFile(wb, `تقرير_الديون_${safeBusinessName}_${dateTag}.xlsx`);
};

/**
 * Export single customer statement to Excel (.xlsx)
 */
export const exportCustomerStatementToExcel = (
  customer: Customer,
  customerDebts: Debt[],
  customerTransactions: Transaction[],
  config: AppConfig,
  userProfile: UserProfile
) => {
  const currency = config.currency || 'MAD';
  const todayStr = new Date().toLocaleDateString('ar-MA');
  const wb = XLSX.utils.book_new();

  const totalLya = customerDebts
    .filter((d) => d.type === 'lya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalAlya = customerDebts
    .filter((d) => d.type === 'alya')
    .reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalPaid = customerTransactions.reduce((acc, t) => acc + t.amount, 0);

  // Customer Summary
  const summaryRows = [
    ['كشف حساب تفصيلي للزبون', ''],
    ['اسم المتجر:', userProfile.businessName || 'متجر الأمانة'],
    ['اسم الزبون:', customer.name],
    ['رقم الهاتف:', customer.phone],
    ['العنوان:', customer.address || '—'],
    ['تاريخ الإصدار:', todayStr],
    ['', ''],
    ['الرصيد المالي للزبون', 'المبلغ'],
    ['إجمالي المستحق عليه (ليا)', totalLya],
    ['إجمالي الواجب له (عليا)', totalAlya],
    ['مجموع المبالغ المسددة', totalPaid],
    ['الرصيد النهائي المستحق', totalLya - totalAlya],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 20 }];
  wsSummary['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص حساب الزبون');

  // Debts details
  const debtHeader = [
    'النوع',
    'بيان الدين',
    'المبلغ الأصلي',
    'المبلغ المؤدى',
    'المتبقي',
    'العملة',
    'تاريخ التسجيل',
    'تاريخ الاستحقاق',
    'الحالة',
    'ملاحظات',
  ];

  const debtRows = customerDebts.map((d) => {
    const paid = d.amount - d.remainingAmount;
    return [
      d.type === 'lya' ? 'دين عليه (ليا)' : 'واجب له (عليا)',
      d.category || 'دين عام',
      d.amount,
      paid,
      d.remainingAmount,
      currency,
      d.date ? d.date.split('T')[0] : '',
      d.dueDate ? d.dueDate.split('T')[0] : '',
      d.remainingAmount === 0 ? 'خالص' : 'متبقي',
      d.notes || '',
    ];
  });

  const wsDebts = XLSX.utils.aoa_to_sheet([debtHeader, ...debtRows]);
  wsDebts['!cols'] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
  ];
  wsDebts['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsDebts, 'سجل الديون والبونات');

  // Transactions details
  const txHeader = [
    'رقم الإيصال',
    'المبلغ المؤدى',
    'العملة',
    'طريقة الدفع',
    'تاريخ الأداء',
    'ملاحظات',
  ];

  const txRows = customerTransactions.map((t) => [
    t.receiptNumber,
    t.amount,
    currency,
    t.paymentMethod || 'نقداً',
    t.paymentDate ? t.paymentDate.split('T')[0] : '',
    t.notes || '',
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txRows]);
  wsTx['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
  ];
  wsTx['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, wsTx, 'سجل الدفعات والإيصالات');

  const dateTag = new Date().toISOString().split('T')[0];
  const safeCustName = customer.name.replace(/[\/\\?%*:|"<>]/g, '_');
  XLSX.writeFile(wb, `كشف_حساب_${safeCustName}_${dateTag}.xlsx`);
};
