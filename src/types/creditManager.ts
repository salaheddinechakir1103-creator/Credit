export type DebtType = 'lya' | 'alya'; // lya = لي (لي عندهم), alya = عليا (لي عليا)

export type DebtStatus = 'unpaid' | 'paid' | 'partial' | 'overdue';

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'check';

export type Language = 'ar' | 'fr' | 'en';

export type Currency = 'MAD' | 'USD' | 'EUR';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DebtInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  customerId: string;
  type: DebtType;
  amount: number;
  remainingAmount: number;
  date: string;
  status: DebtStatus;
  notes?: string;
  category?: string;
  installments?: DebtInstallment[];
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  debtId: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptNumber: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoicePaymentType = 'credit' | 'partial' | 'cash';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  transportFee?: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentType: InvoicePaymentType;
  paymentMethod?: PaymentMethod;
  debtId?: string;
  notes?: string;
  previousBalance?: number;
  newTotalBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export type CommercialPaperType = 'cheque' | 'traite'; // شيك | كمبيالة (لاطريت)
export type CommercialPaperDirection = 'in' | 'out'; // مقبوض (وارد من زبون) | صادر (مدفوع لمورد)
export type CommercialPaperStatus =
  | 'safe' // في الحفظ / في المحفظة (En portefeuille)
  | 'deposited' // مودع بالبنك للتحصيل (Déposé / Remis à l'encaissement)
  | 'cashed' // تم الصرف بنجاح (Encaissé / Payé)
  | 'rejected' // مرفوض / بدون رصيد (Rejeté / Impayé)
  | 'cancelled'; // ملغى أو مسترجع (Annulé / Restitué)

export interface CommercialPaper {
  id: string;
  number: string; // رقم الشيك أو الكمبيالة
  type: CommercialPaperType; // 'cheque' أو 'traite'
  direction: CommercialPaperDirection; // 'in' (وارد) أو 'out' (صادر)
  amount: number;
  dueDate: string; // تاريخ الاستحقاق / الصرف (YYYY-MM-DD)
  issueDate?: string; // تاريخ التحرير
  bankName: string; // اسم البنك (مثل التجاري وفا بنك، البنك الشعبي، CIH...)
  agency?: string; // الوكالة البنكية
  drawer: string; // الساحب (صاحب الشيك أو الموقع)
  customerId?: string; // معرف الزبون المرتبط إن وجد
  beneficiary?: string; // المستفيد
  depositDate?: string; // تاريخ الإيداع بالبنك
  cashedDate?: string; // تاريخ الصرف الفعلي
  status: CommercialPaperStatus;
  notes?: string;
  linkedDebtId?: string; // ربط تلقائي بالدين
  linkedInvoiceId?: string; // ربط بالفاتورة
  frontPhotoUrl?: string; // صورة الشيك أو لاطريت
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  debtId?: string;
  customerId?: string;
  paperId?: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'due_soon' | 'overdue' | 'system' | 'payment' | 'cheque_due_soon' | 'cheque_overdue';
}

export interface AppConfig {
  language: Language;
  theme: ThemeMode;
  currency: Currency;
  pinCode?: string;
  isLocked: boolean;
  biometricEnabled: boolean;
  firebaseSyncEnabled: boolean;
  lastSyncDate?: string;
  reminderDaysBefore: number;
}

export interface UserProfile {
  name: string;
  email: string;
  businessName: string;
  phone: string;
  avatarUrl?: string;
}
