import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  FileText,
  DollarSign,
  Calendar,
  User,
  Phone,
  Search,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { Customer, InvoiceItem, InvoicePaymentType } from '../types/creditManager';
import { formatCurrency } from '../utils/formatters';
import { getTranslation } from '../utils/translations';

interface CreateInvoiceModalProps {
  defaultCustomerId?: string;
  onClose: () => void;
  onInvoiceCreated?: (invoiceId: string) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  defaultCustomerId,
  onClose,
  onInvoiceCreated,
}) => {
  const { customers, debts, invoices, createInvoice, config } = useCreditManager();
  const t = getTranslation(config.language);

  // Suggested next invoice number
  const nextInvoiceNumber = useMemo(() => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `FAC-${year}-${String(count).padStart(3, '0')}`;
  }, [invoices]);

  const initialCustId = defaultCustomerId || (customers.length === 1 ? customers[0].id : '');
  const [customerId, setCustomerId] = useState<string>(initialCustId);
  const [searchCustomer, setSearchCustomer] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(nextInvoiceNumber);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [paymentType, setPaymentType] = useState<InvoicePaymentType>('credit');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'check'>('cash');
  const [discountInput, setDiscountInput] = useState<string>('0');
  const [taxPercentInput, setTaxPercentInput] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  // Invoice Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: `it-${Date.now()}-1`, name: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Existing debt for this customer
  const previousDebtBalance = useMemo(() => {
    if (!customerId) return 0;
    return debts
      .filter((d) => d.customerId === customerId && d.type === 'lya' && d.remainingAmount > 0)
      .reduce((sum, d) => sum + d.remainingAmount, 0);
  }, [debts, customerId]);

  // Customer search filtering
  const filteredCustomers = useMemo(() => {
    if (!searchCustomer.trim()) return customers.slice(0, 8);
    const term = searchCustomer.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.address && c.address.toLowerCase().includes(term))
    );
  }, [customers, searchCustomer]);

  // Items manipulation
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setItems((prev) => {
      const copy = [...prev];
      const current = { ...copy[index] };

      if (field === 'name') {
        current.name = String(value);
      } else if (field === 'quantity') {
        const qty = Math.max(1, Number(value) || 0);
        current.quantity = qty;
        current.total = qty * current.unitPrice;
      } else if (field === 'unitPrice') {
        const pr = Math.max(0, Number(value) || 0);
        current.unitPrice = pr;
        current.total = current.quantity * pr;
      }

      copy[index] = current;
      return copy;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { id: `it-${Date.now()}-${prev.length + 1}`, name: '', quantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [items]);

  const discount = Math.max(0, parseFloat(discountInput) || 0);
  const taxPercent = Math.max(0, parseFloat(taxPercentInput) || 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = (afterDiscount * taxPercent) / 100;
  const totalAmount = Math.round((afterDiscount + taxAmount) * 100) / 100;

  // Paid & Remaining according to payment type
  const calculatedPaidAmount = useMemo(() => {
    if (paymentType === 'cash') return totalAmount;
    if (paymentType === 'credit') return 0;
    const p = parseFloat(paidAmountInput) || 0;
    return Math.min(totalAmount, Math.max(0, p));
  }, [paymentType, totalAmount, paidAmountInput]);

  const remainingAmount = Math.max(0, Math.round((totalAmount - calculatedPaidAmount) * 100) / 100);

  // Estimated new total debt balance after adding this invoice
  const newEstimatedTotalDebt = previousDebtBalance + remainingAmount;

  const isFormValid =
    customerId &&
    invoiceNumber.trim() &&
    items.some((i) => i.name.trim() && i.quantity > 0 && i.unitPrice > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const validItems = items
      .filter((i) => i.name.trim())
      .map((i) => ({
        id: i.id,
        name: i.name.trim(),
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unitPrice) || 0,
        total: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0),
      }));

    if (validItems.length === 0) return;

    const created = await createInvoice({
      invoiceNumber: invoiceNumber.trim(),
      customerId,
      date,
      dueDate: paymentType === 'cash' ? date : dueDate,
      items: validItems,
      subtotal,
      discount,
      tax: taxAmount,
      totalAmount,
      paidAmount: calculatedPaidAmount,
      remainingAmount,
      paymentType,
      paymentMethod: calculatedPaidAmount > 0 ? paymentMethod : undefined,
      notes: notes.trim(),
    });

    if (onInvoiceCreated) {
      onInvoiceCreated(created.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
              <Receipt className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>إنشاء فاتورة جديدة للزبون</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  تحديث الرصيد تلقائياً
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                تضاف قيمة الفاتورة غير المسددة مباشرة وبشكل تلقائي إلى حساب دين الزبون
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200">
          {/* Customer Selection & Invoice Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                الزبون المسجل لدينا *
              </label>
              {selectedCustomer ? (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedCustomer.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {selectedCustomer.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-indigo-500" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    </div>
                  </div>

                  {!defaultCustomerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerId('');
                        setSearchCustomer('');
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
                    >
                      تغيير
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchCustomer}
                      onChange={(e) => setSearchCustomer(e.target.value)}
                      placeholder="ابحث عن الزبون بالاسم أو الهاتف..."
                      className="w-full ps-9 pe-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pe-1 border border-slate-100 dark:border-slate-800 rounded-xl p-1 bg-slate-50/50 dark:bg-slate-800/30">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3">لم يتم العثور على زبون</p>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCustomerId(c.id)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-lg text-start flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 transition-colors"
                        >
                          <span>{c.name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">{c.phone}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رقم الفاتورة
                </label>
                <div className="relative">
                  <Receipt className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                    className="w-full ps-9 pe-3 py-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاريخ الفاتورة
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تاريخ الاستحقاق للدين (موعد السداد المتفق عليه)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={paymentType === 'cash'}
                    className="w-full ps-9 pe-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Items Table Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>تفاصيل السلع والمواد المفوترة ({items.length})</span>
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة سطر جديد</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
                    <tr>
                      <th className="p-3 text-start w-7">#</th>
                      <th className="p-3 text-start">اسم المادة / السلعة / الخدمة *</th>
                      <th className="p-3 text-start w-24">الكمية</th>
                      <th className="p-3 text-start w-32">سعر الوحدة ({config.currency})</th>
                      <th className="p-3 text-start w-28">المجموع</th>
                      <th className="p-3 text-center w-10">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            placeholder="مثال: زيت 5 لتر، دقيق 50 كلغ، إصلاح شاشة..."
                            required
                            className="w-full px-3 py-1.5 text-xs font-medium bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-bold text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice || ''}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            placeholder="0.00"
                            required
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          />
                        </td>
                        <td className="p-3 font-extrabold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(item.total, config.currency, config.language)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            disabled={items.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payment Type Selection & Automatic Debt Automation Options */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
              طريقة تسوية الفاتورة وتأثيرها على دين الزبون:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: 100% Credit */}
              <button
                type="button"
                onClick={() => setPaymentType('credit')}
                className={`p-3 rounded-xl border text-start flex flex-col gap-1 transition-all ${
                  paymentType === 'credit'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">على الحساب (كريدي 100%)</span>
                  {paymentType === 'credit' && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  تضاف قيمة الفاتورة كاملة تلقائياً إلى دين الزبون
                </p>
              </button>

              {/* Option 2: Partial with downpayment */}
              <button
                type="button"
                onClick={() => setPaymentType('partial')}
                className={`p-3 rounded-xl border text-start flex flex-col gap-1 transition-all ${
                  paymentType === 'partial'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">تسبيق + باقي كريدي</span>
                  {paymentType === 'partial' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  دفع تسبيق مالي وإضافة الباقي تلقائياً لدين الزبون
                </p>
              </button>

              {/* Option 3: Paid Cash */}
              <button
                type="button"
                onClick={() => setPaymentType('cash')}
                className={`p-3 rounded-xl border text-start flex flex-col gap-1 transition-all ${
                  paymentType === 'cash'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">مدفوعة كاش بالكامل</span>
                  {paymentType === 'cash' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  سداد كامل فوراً ولا يزداد رصيد دين الزبون
                </p>
              </button>
            </div>

            {/* If partial or cash payment, ask for paid amount and payment method */}
            {paymentType === 'partial' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ المسدد مسبقاً كـ (تسبيق) *
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      placeholder="0.00"
                      required
                      max={totalAmount}
                      className="w-full ps-9 pe-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    طريقة دفع التسبيق
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  >
                    <option value="cash">نقداً (كاش)</option>
                    <option value="transfer">تحويل بنكي</option>
                    <option value="card">بطاقة بنكية</option>
                    <option value="check">شيك</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Discount & Additional Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تخفيض / خصم ({config.currency})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ملاحظات الفاتورة أو شروط التسليم
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: تسليم المحل، بضاعة أسبوعية، متفق عليها..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* Live Financial Balance Summary Banner (Automatic Debt Calculation) */}
          <div className="p-4 rounded-2xl bg-indigo-900 text-white space-y-2.5 shadow-md">
            <div className="flex items-center justify-between text-xs text-indigo-200">
              <span>المجموع الفرعي للسلع:</span>
              <span className="font-bold text-white">
                {formatCurrency(subtotal, config.currency, config.language)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex items-center justify-between text-xs text-amber-300">
                <span>الخصم المطبق:</span>
                <span className="font-bold">
                  -{formatCurrency(discount, config.currency, config.language)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm font-extrabold pt-2 border-t border-indigo-700/80">
              <span>المبلغ الإجمالي للفاتورة:</span>
              <span className="text-base text-white">
                {formatCurrency(totalAmount, config.currency, config.language)}
              </span>
            </div>

            {/* Balance Increase Live Preview */}
            <div className="mt-3 p-3 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-indigo-300">
                <span>الرصيد السابق للزبون:</span>
                <span className="font-bold">
                  {formatCurrency(previousDebtBalance, config.currency, config.language)}
                </span>
              </div>
              <div className="flex items-center justify-between text-rose-300 font-bold">
                <span>+ الزيادة التلقائية على دين الزبون (المتبقي):</span>
                <span>+{formatCurrency(remainingAmount, config.currency, config.language)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-300 font-extrabold pt-1 border-t border-indigo-800">
                <span>= الرصيد الإجمالي الجديد للزبون:</span>
                <span className="text-sm">
                  {formatCurrency(newEstimatedTotalDebt, config.currency, config.language)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className="px-6 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>إصدار الفاتورة وزيادة الدين تلقائياً</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
