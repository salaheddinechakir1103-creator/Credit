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
  creditLimit?: number;
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
  dueDate: string;
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
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentType: InvoicePaymentType;
  paymentMethod?: PaymentMethod;
  debtId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  debtId?: string;
  customerId?: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'due_soon' | 'overdue' | 'system' | 'payment';
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
