import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Customer,
  Debt,
  DebtStatus,
  Transaction,
  Invoice,
  InvoiceItem,
  NotificationItem,
  AppConfig,
  UserProfile,
} from '../types/creditManager';

function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  });
  return result;
}

interface CreditManagerContextType {
  customers: Customer[];
  debts: Debt[];
  transactions: Transaction[];
  invoices: Invoice[];
  notifications: NotificationItem[];
  config: AppConfig;
  userProfile: UserProfile;
  
  // Quick active modals state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  
  // Customer CRUD
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Debt CRUD
  addDebt: (debt: Omit<Debt, 'id' | 'remainingAmount' | 'status' | 'createdAt' | 'updatedAt'>, mergeWithExisting?: boolean) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  consolidateCustomerDebts: (customerId: string) => Promise<void>;

  // Invoices & Automatic Debt Generation
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'debtId'> & { debtId?: string }) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string, deleteLinkedDebt?: boolean) => Promise<void>;

  // Transactions & Payments
  recordPayment: (payment: {
    debtId?: string;
    customerId?: string;
    amount: number;
    paymentMethod: Transaction['paymentMethod'];
    notes?: string;
    paymentDate?: string;
  }) => Promise<void>;
  deleteTransaction: (id: string) => void;

  // Config & Profile & Security
  updateConfig: (updates: Partial<AppConfig>) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  markNotificationRead: (id?: string) => void;
  lockApp: () => void;
  unlockApp: (pin: string) => boolean;
  setPinCode: (pin: string) => void;
  
  // Data Backup / Restore
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  resetAllData: () => void;
  triggerSync: () => void;
}

const CreditManagerContext = createContext<CreditManagerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'credit_manager_v2_data';

// Initial Rich Sample Data
const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'كمال الوردي',
    phone: '0661234567',
    address: 'شارع محمد الخامس، الدار البيضاء',
    notes: 'زبون دائم - متجر البقالة المركزي',
    creditLimit: 15000,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-2',
    name: 'شركة الأمل للتوزيع',
    phone: '0522987654',
    address: 'المنطقة الصناعية، عين السبع',
    notes: 'مورد المواد الغذائية',
    creditLimit: 50000,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-3',
    name: 'فاطمة الزهراء الإدريسي',
    phone: '0665112233',
    address: 'حي أگدال، الرباط',
    notes: 'طلبيات الملابس الجاهزة',
    creditLimit: 8000,
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-4',
    name: 'عبد الرحيم البقالي',
    phone: '0671445566',
    address: 'طريق فاس، طنجة',
    notes: 'ورشة النجارة والتأثيث',
    creditLimit: 10000,
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const initialDebts: Debt[] = [
  {
    id: 'debt-1',
    customerId: 'cust-1',
    type: 'lya',
    amount: 3500,
    remainingAmount: 1500,
    date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status: 'partial',
    category: 'بضائع شحنة الزيت والسكر',
    notes: 'تم أداء 2000 د.م نقداً يوم 15 في الشهر',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'debt-2',
    customerId: 'cust-2',
    type: 'alya',
    amount: 12000,
    remainingAmount: 12000,
    date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    status: 'unpaid',
    category: 'فاتورة توريد المعلبات رقم #892',
    notes: 'استحقاق بشيك بنكي',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'debt-3',
    customerId: 'cust-3',
    type: 'lya',
    amount: 2400,
    remainingAmount: 2400,
    date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // overdue!
    status: 'overdue',
    category: 'أزياء تقليدية للمحل',
    notes: 'تأخرت بالأداء، تواصلت معها عبر واتساب',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'debt-4',
    customerId: 'cust-4',
    type: 'lya',
    amount: 1800,
    remainingAmount: 0,
    date: new Date(Date.now() - 40 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    status: 'paid',
    category: 'خشب وزوايا ألومنيوم',
    notes: 'سدد بالكامل كاش',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    debtId: 'debt-1',
    customerId: 'cust-1',
    amount: 2000,
    paymentDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: 'دفعة أولى من الحساب',
    receiptNumber: 'REC-2026-001',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'tx-2',
    debtId: 'debt-4',
    customerId: 'cust-4',
    amount: 1800,
    paymentDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    paymentMethod: 'transfer',
    notes: 'تسوية نهائية للحساب',
    receiptNumber: 'REC-2026-002',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  }
];

const initialInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'FAC-2026-001',
    customerId: 'cust-1',
    date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    items: [
      { id: 'item-1', name: 'زيت المائدة 5 لتر (كرتون)', quantity: 5, unitPrice: 320, total: 1600 },
      { id: 'item-2', name: 'سكر قوالب 25 كلغ (أكياس)', quantity: 3, unitPrice: 240, total: 720 },
      { id: 'item-3', name: 'دقيق ممتاز 50 كلغ', quantity: 4, unitPrice: 295, total: 1180 },
    ],
    subtotal: 3500,
    discount: 0,
    tax: 0,
    totalAmount: 3500,
    paidAmount: 2000,
    remainingAmount: 1500,
    paymentType: 'partial',
    debtId: 'debt-1',
    notes: 'بون مشتريات الجملة للأسبوع الثالث',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv-2',
    invoiceNumber: 'FAC-2026-002',
    customerId: 'cust-3',
    date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    items: [
      { id: 'item-4', name: 'قفطان مغربي مطرز أصيل', quantity: 1, unitPrice: 1500, total: 1500 },
      { id: 'item-5', name: 'جلابة نسائية صوفية ممتازة', quantity: 1, unitPrice: 900, total: 900 },
    ],
    subtotal: 2400,
    discount: 0,
    tax: 0,
    totalAmount: 2400,
    paidAmount: 0,
    remainingAmount: 2400,
    paymentType: 'credit',
    debtId: 'debt-3',
    notes: 'طلبية خاصة مع التسليم',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    debtId: 'debt-3',
    customerId: 'cust-3',
    title: 'تأخر عن موعد السداد',
    message: 'الدين الخاص بـ فاطمة الزهراء الإدريسي بقيمة 2,400 د.م تجاوز موعد الاستحقاق',
    date: new Date().toISOString(),
    read: false,
    type: 'overdue',
  },
  {
    id: 'notif-2',
    debtId: 'debt-1',
    customerId: 'cust-1',
    title: 'اقتراب موعد السداد',
    message: 'مستحق كمال الوردي المتبقي (1,500 د.م) يستحق خلال 5 أيام',
    date: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    type: 'due_soon',
  }
];

const defaultConfig: AppConfig = {
  language: 'ar',
  theme: 'light',
  currency: 'MAD',
  pinCode: '1234',
  isLocked: true,
  biometricEnabled: false,
  firebaseSyncEnabled: true,
  lastSyncDate: new Date().toISOString(),
  reminderDaysBefore: 3,
};

const defaultProfile: UserProfile = {
  name: 'سفيان العبودي',
  email: 'snssa8171@gmail.com',
  businessName: 'متجر الأمانة للتجارة والخدمات',
  phone: '0600000000',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
};

export const CreditManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_customers`);
      return saved && saved !== 'undefined' ? JSON.parse(saved) : initialCustomers;
    } catch {
      return initialCustomers;
    }
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_debts`);
      return saved && saved !== 'undefined' ? JSON.parse(saved) : initialDebts;
    } catch {
      return initialDebts;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_transactions`);
      return saved && saved !== 'undefined' ? JSON.parse(saved) : initialTransactions;
    } catch {
      return initialTransactions;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_invoices`);
      return saved && saved !== 'undefined' ? JSON.parse(saved) : initialInvoices;
    } catch {
      return initialInvoices;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notifications`);
      return saved && saved !== 'undefined' ? JSON.parse(saved) : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_config`);
      const parsed = saved && saved !== 'undefined' ? JSON.parse(saved) : {};
      return {
        ...defaultConfig,
        ...parsed,
        pinCode: parsed.pinCode || '1234',
        isLocked: true, // Always require PIN code on startup
      };
    } catch {
      return defaultConfig;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_profile`);
      return saved && saved !== 'undefined' ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Firestore Real-time Sync
  useEffect(() => {
    // 1. Sync Customers
    const unsubCust = onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        if (snapshot.empty) {
          const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_customers`);
          const localCusts: Customer[] =
            saved && saved !== 'undefined' ? JSON.parse(saved) : initialCustomers;
          if (localCusts && localCusts.length > 0) {
            localCusts.forEach((c) => {
              setDoc(doc(db, 'customers', c.id), cleanForFirestore(c)).catch(console.error);
            });
            setCustomers(localCusts);
          } else {
            setCustomers([]);
          }
        } else {
          const custs: Customer[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data() as Customer;
            if (d && d.id) custs.push(d);
          });
          custs.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setCustomers(custs);
        }
      },
      (err) => console.error('Firestore customers error:', err)
    );

    // 2. Sync Debts
    const unsubDebts = onSnapshot(
      collection(db, 'debts'),
      (snapshot) => {
        if (snapshot.empty) {
          const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_debts`);
          const localDebts: Debt[] =
            saved && saved !== 'undefined' ? JSON.parse(saved) : initialDebts;
          if (localDebts && localDebts.length > 0) {
            localDebts.forEach((d) => {
              setDoc(doc(db, 'debts', d.id), cleanForFirestore(d)).catch(console.error);
            });
            setDebts(localDebts);
          } else {
            setDebts([]);
          }
        } else {
          const dlist: Debt[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data() as Debt;
            if (d && d.id) dlist.push(d);
          });
          dlist.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setDebts(dlist);
        }
      },
      (err) => console.error('Firestore debts error:', err)
    );

    // 3. Sync Transactions
    const unsubTx = onSnapshot(
      collection(db, 'transactions'),
      (snapshot) => {
        if (snapshot.empty) {
          const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_transactions`);
          const localTxs: Transaction[] =
            saved && saved !== 'undefined' ? JSON.parse(saved) : initialTransactions;
          if (localTxs && localTxs.length > 0) {
            localTxs.forEach((t) => {
              setDoc(doc(db, 'transactions', t.id), cleanForFirestore(t)).catch(console.error);
            });
            setTransactions(localTxs);
          } else {
            setTransactions([]);
          }
        } else {
          const txs: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            const t = docSnap.data() as Transaction;
            if (t && t.id) txs.push(t);
          });
          txs.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setTransactions(txs);
        }
      },
      (err) => console.error('Firestore transactions error:', err)
    );

    // 4. Sync Invoices
    const unsubInvoices = onSnapshot(
      collection(db, 'invoices'),
      (snapshot) => {
        if (snapshot.empty) {
          const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_invoices`);
          const localInvs: Invoice[] =
            saved && saved !== 'undefined' ? JSON.parse(saved) : initialInvoices;
          if (localInvs && localInvs.length > 0) {
            localInvs.forEach((inv) => {
              setDoc(doc(db, 'invoices', inv.id), cleanForFirestore(inv)).catch(console.error);
            });
            setInvoices(localInvs);
          } else {
            setInvoices([]);
          }
        } else {
          const invs: Invoice[] = [];
          snapshot.forEach((docSnap) => {
            const inv = docSnap.data() as Invoice;
            if (inv && inv.id) invs.push(inv);
          });
          invs.sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setInvoices(invs);
        }
      },
      (err) => console.error('Firestore invoices error:', err)
    );

    // 5. Sync Notifications
    const unsubNotif = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        if (snapshot.empty) {
          const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_notifications`);
          const localNotifs: NotificationItem[] =
            saved && saved !== 'undefined' ? JSON.parse(saved) : initialNotifications;
          if (localNotifs && localNotifs.length > 0) {
            localNotifs.forEach((n) => {
              setDoc(doc(db, 'notifications', n.id), cleanForFirestore(n)).catch(console.error);
            });
            setNotifications(localNotifs);
          } else {
            setNotifications([]);
          }
        } else {
          const notifs: NotificationItem[] = [];
          snapshot.forEach((docSnap) => {
            const n = docSnap.data() as NotificationItem;
            if (n && n.id) notifs.push(n);
          });
          notifs.sort(
            (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
          );
          setNotifications(notifs);
        }
      },
      (err) => console.error('Firestore notifications error:', err)
    );

    // 5. Sync Config
    const unsubConfig = onSnapshot(
      doc(db, 'settings', 'config'),
      (docSnap) => {
        if (docSnap.exists()) {
          const cloudConfig = docSnap.data() as AppConfig;
          setConfig((prev) => ({
            ...prev,
            ...cloudConfig,
            pinCode: cloudConfig.pinCode || prev.pinCode || '1234',
            isLocked: prev.isLocked, // preserve runtime lock status
          }));
        } else {
          const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_config`);
          const localCfg =
            saved && saved !== 'undefined' ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
          setConfig((prev) => ({
            ...localCfg,
            pinCode: localCfg.pinCode || '1234',
            isLocked: prev.isLocked,
          }));
          setDoc(doc(db, 'settings', 'config'), cleanForFirestore(localCfg)).catch(console.error);
        }
      },
      (err) => console.error('Firestore config error:', err)
    );

    // 6. Sync Profile
    const unsubProfile = onSnapshot(
      doc(db, 'settings', 'profile'),
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_profile`);
          const localProf =
            saved && saved !== 'undefined' ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
          setUserProfile(localProf);
          setDoc(doc(db, 'settings', 'profile'), cleanForFirestore(localProf)).catch(console.error);
        }
      },
      (err) => console.error('Firestore profile error:', err)
    );

    return () => {
      unsubCust();
      unsubDebts();
      unsubTx();
      unsubInvoices();
      unsubNotif();
      unsubConfig();
      unsubProfile();
    };
  }, []);

  // Sync to LocalStorage as backup
  useEffect(() => {
    try { localStorage.setItem(`${LOCAL_STORAGE_KEY}_customers`, JSON.stringify(customers)); } catch (e) { console.error(e); }
  }, [customers]);

  useEffect(() => {
    try { localStorage.setItem(`${LOCAL_STORAGE_KEY}_debts`, JSON.stringify(debts)); } catch (e) { console.error(e); }
  }, [debts]);

  useEffect(() => {
    try { localStorage.setItem(`${LOCAL_STORAGE_KEY}_transactions`, JSON.stringify(transactions)); } catch (e) { console.error(e); }
  }, [transactions]);

  useEffect(() => {
    try { localStorage.setItem(`${LOCAL_STORAGE_KEY}_invoices`, JSON.stringify(invoices)); } catch (e) { console.error(e); }
  }, [invoices]);

  useEffect(() => {
    try { localStorage.setItem(`${LOCAL_STORAGE_KEY}_notifications`, JSON.stringify(notifications)); } catch (e) { console.error(e); }
  }, [notifications]);

  useEffect(() => {
    try { localStorage.setItem(`${LOCAL_STORAGE_KEY}_config`, JSON.stringify(config)); } catch (e) { console.error(e); }
    // Apply dark class to html document
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (config.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    // Set RTL or LTR document direction
    document.documentElement.setAttribute('dir', config.language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', config.language);
  }, [config]);

  useEffect(() => {
    try { localStorage.setItem(`${LOCAL_STORAGE_KEY}_profile`, JSON.stringify(userProfile)); } catch (e) { console.error(e); }
  }, [userProfile]);

  // Customer Actions
  const addCustomer = async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    try {
      await setDoc(doc(db, 'customers', newCust.id), cleanForFirestore(newCust));
    } catch (e) {
      console.error('Add customer firestore error:', e);
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
    try {
      await setDoc(doc(db, 'customers', id), cleanForFirestore(updated), { merge: true });
    } catch (e) {
      console.error('Update customer firestore error:', e);
    }
  };

  const deleteCustomer = async (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    const customerDebtIds = debts.filter((d) => d.customerId === id).map((d) => d.id);
    setDebts((prev) => prev.filter((d) => d.customerId !== id));
    setTransactions((prev) => prev.filter((t) => !customerDebtIds.includes(t.debtId)));
    if (selectedCustomerId === id) setSelectedCustomerId(null);

    try {
      await deleteDoc(doc(db, 'customers', id));
      for (const dId of customerDebtIds) {
        await deleteDoc(doc(db, 'debts', dId));
      }
    } catch (e) {
      console.error('Delete customer firestore error:', e);
    }
  };

  // Debt Actions
  const addDebt = async (
    data: Omit<Debt, 'id' | 'remainingAmount' | 'status' | 'createdAt' | 'updatedAt'>,
    mergeWithExisting: boolean = false
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = data.dueDate < todayStr;

    // Check if customer already has an unpaid debt of the same type that we should merge with
    if (mergeWithExisting) {
      const existingDebt = debts.find(
        (d) => d.customerId === data.customerId && d.type === data.type && d.remainingAmount > 0
      );
      if (existingDebt) {
        const mergedAmount = existingDebt.amount + data.amount;
        const mergedRemaining = existingDebt.remainingAmount + data.amount;
        const updatedCategory = existingDebt.category
          ? `${existingDebt.category} + ${data.category || 'إضافة جديدة'}`
          : data.category || 'حساب إجمالي موحد';
        const updatedNotes = data.notes
          ? `${existingDebt.notes ? existingDebt.notes + ' | ' : ''}إضافة جديدة: ${data.notes}`
          : existingDebt.notes;

        const updatedDebt: Debt = {
          ...existingDebt,
          amount: mergedAmount,
          remainingAmount: mergedRemaining,
          category: updatedCategory,
          notes: updatedNotes,
          dueDate: data.dueDate > existingDebt.dueDate ? data.dueDate : existingDebt.dueDate,
          updatedAt: new Date().toISOString(),
          status: isOverdue ? 'overdue' : 'unpaid',
        };

        setDebts((prev) => prev.map((d) => (d.id === existingDebt.id ? updatedDebt : d)));

        try {
          await setDoc(doc(db, 'debts', existingDebt.id), cleanForFirestore(updatedDebt), { merge: true });
        } catch (e) {
          console.error('Update merged debt firestore error:', e);
        }
        return;
      }
    }

    const newDebt: Debt = {
      ...data,
      id: `debt-${Date.now()}`,
      remainingAmount: data.amount,
      status: isOverdue ? 'overdue' : 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDebts((prev) => [newDebt, ...prev]);
    try {
      await setDoc(doc(db, 'debts', newDebt.id), cleanForFirestore(newDebt));
    } catch (e) {
      console.error('Add debt firestore error:', e);
    }
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    let updatedObj: Debt | null = null;
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates, updatedAt: new Date().toISOString() };
        if (updated.remainingAmount <= 0) {
          updated.status = 'paid';
          updated.remainingAmount = 0;
        } else if (updated.remainingAmount < updated.amount) {
          updated.status = 'partial';
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          updated.status = updated.dueDate < todayStr ? 'overdue' : 'unpaid';
        }
        updatedObj = updated;
        return updated;
      })
    );
    if (updatedObj) {
      try {
        await setDoc(doc(db, 'debts', id), cleanForFirestore(updatedObj), { merge: true });
      } catch (e) {
        console.error('Update debt firestore error:', e);
      }
    }
  };

  const deleteDebt = async (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    setTransactions((prev) => prev.filter((t) => t.debtId !== id));
    try {
      await deleteDoc(doc(db, 'debts', id));
    } catch (e) {
      console.error('Delete debt firestore error:', e);
    }
  };

  const consolidateCustomerDebts = async (customerId: string) => {
    const custDebts = debts.filter((d) => d.customerId === customerId && d.remainingAmount > 0);
    if (custDebts.length <= 1) return;

    const totalAmount = custDebts.reduce((sum, d) => sum + d.amount, 0);
    const totalRemaining = custDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const primaryDebt = custDebts[0];
    const otherDebts = custDebts.slice(1);

    const mergedDebt: Debt = {
      ...primaryDebt,
      amount: totalAmount,
      remainingAmount: totalRemaining,
      category: 'بون إجمالي موحد (القديم والجديد)',
      notes: `تم دمج ${custDebts.length} بونات/ديون في حساب موحد بتاريخ ${new Date().toLocaleDateString('ar-MA')}`,
      updatedAt: new Date().toISOString(),
    };

    setDebts((prev) => {
      const otherIds = otherDebts.map((od) => od.id);
      return prev
        .filter((d) => !otherIds.includes(d.id))
        .map((d) => (d.id === primaryDebt.id ? mergedDebt : d));
    });

    setTransactions((prev) =>
      prev.map((t) => (otherDebts.some((od) => od.id === t.debtId) ? { ...t, debtId: primaryDebt.id } : t))
    );

    try {
      await setDoc(doc(db, 'debts', primaryDebt.id), cleanForFirestore(mergedDebt), { merge: true });
      for (const od of otherDebts) {
        await deleteDoc(doc(db, 'debts', od.id));
      }
    } catch (e) {
      console.error('Consolidate debts firestore error:', e);
    }
  };

  // Invoices Management & Automatic Debt Increment
  const createInvoice = async (
    data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'debtId'> & { debtId?: string }
  ): Promise<Invoice> => {
    const invId = `inv-${Date.now()}`;
    const nowIso = new Date().toISOString();
    let generatedDebtId = data.debtId;

    // Automatic Debt Generation: When invoice has remaining unpaid balance (credit or partial)
    if (data.remainingAmount > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const isOverdue = data.dueDate ? data.dueDate < todayStr : false;
      const debtId = `debt-inv-${Date.now()}`;
      generatedDebtId = debtId;

      const itemsSummary = data.items.map((it) => `${it.name} (${it.quantity}x)`).join('، ');

      const newDebt: Debt = {
        id: debtId,
        customerId: data.customerId,
        type: 'lya',
        amount: data.totalAmount,
        remainingAmount: data.remainingAmount,
        date: data.date,
        dueDate: data.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        status: data.paidAmount > 0 ? 'partial' : isOverdue ? 'overdue' : 'unpaid',
        category: `فاتورة مشتريات #${data.invoiceNumber}`,
        notes: `فاتورة #${data.invoiceNumber}: ${itemsSummary}${data.notes ? ` | ${data.notes}` : ''}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setDebts((prev) => [newDebt, ...prev]);
      try {
        await setDoc(doc(db, 'debts', newDebt.id), cleanForFirestore(newDebt));
      } catch (e) {
        console.error('Create invoice debt firestore error:', e);
      }

      // If down payment was made (paidAmount > 0), also record transaction
      if (data.paidAmount > 0) {
        const txId = `tx-inv-${Date.now()}`;
        const newTx: Transaction = {
          id: txId,
          debtId: debtId,
          customerId: data.customerId,
          amount: data.paidAmount,
          paymentDate: data.date,
          paymentMethod: data.paymentMethod || 'cash',
          notes: `تسبيق / دفعة مسبقة عن الفاتورة #${data.invoiceNumber}`,
          receiptNumber: `REC-${data.invoiceNumber}`,
          createdAt: nowIso,
        };
        setTransactions((prev) => [newTx, ...prev]);
        try {
          await setDoc(doc(db, 'transactions', newTx.id), cleanForFirestore(newTx));
        } catch (e) {
          console.error('Create invoice tx firestore error:', e);
        }
      }
    } else if (data.paidAmount === data.totalAmount && data.totalAmount > 0) {
      // Fully paid cash invoice
      const debtId = `debt-inv-${Date.now()}`;
      generatedDebtId = debtId;
      const itemsSummary = data.items.map((it) => `${it.name} (${it.quantity}x)`).join('، ');

      const newDebt: Debt = {
        id: debtId,
        customerId: data.customerId,
        type: 'lya',
        amount: data.totalAmount,
        remainingAmount: 0,
        date: data.date,
        dueDate: data.date,
        status: 'paid',
        category: `فاتورة نقدية #${data.invoiceNumber}`,
        notes: `فاتورة #${data.invoiceNumber} (مدفوعة كاش): ${itemsSummary}`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setDebts((prev) => [newDebt, ...prev]);

      const txId = `tx-inv-${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        debtId: debtId,
        customerId: data.customerId,
        amount: data.totalAmount,
        paymentDate: data.date,
        paymentMethod: data.paymentMethod || 'cash',
        notes: `سداد كامل كاش للفاتورة #${data.invoiceNumber}`,
        receiptNumber: `REC-${data.invoiceNumber}`,
        createdAt: nowIso,
      };
      setTransactions((prev) => [newTx, ...prev]);

      try {
        await setDoc(doc(db, 'debts', newDebt.id), cleanForFirestore(newDebt));
        await setDoc(doc(db, 'transactions', newTx.id), cleanForFirestore(newTx));
      } catch (e) {
        console.error('Create cash invoice firestore error:', e);
      }
    }

    const newInvoice: Invoice = {
      ...data,
      id: invId,
      debtId: generatedDebtId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Create notification
    const cust = customers.find((c) => c.id === data.customerId);
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      customerId: data.customerId,
      debtId: generatedDebtId,
      title: 'إصدار فاتورة جديدة',
      message: `تم إصدار الفاتورة #${data.invoiceNumber} للزبون ${cust?.name || ''} بمبلغ ${data.totalAmount} د.م وإضافتها تلقائياً للرصيد`,
      date: nowIso,
      read: false,
      type: 'system',
    };
    setNotifications((prev) => [notif, ...prev]);

    try {
      await setDoc(doc(db, 'invoices', newInvoice.id), cleanForFirestore(newInvoice));
      await setDoc(doc(db, 'notifications', notif.id), cleanForFirestore(notif));
    } catch (e) {
      console.error('Save invoice firestore error:', e);
    }

    try {
      confetti({ particleCount: 60, spread: 65, origin: { y: 0.7 } });
    } catch {}

    return newInvoice;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const existing = invoices.find((inv) => inv.id === id);
    if (!existing) return;

    const nowIso = new Date().toISOString();
    const updatedInvoice: Invoice = { ...existing, ...updates, updatedAt: nowIso };

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? updatedInvoice : inv))
    );

    // If there is an associated debt, update it as well
    if (updatedInvoice.debtId) {
      const itemsSummary = updatedInvoice.items
        ? updatedInvoice.items.map((it) => `${it.name} (${it.quantity}x)`).join('، ')
        : '';
      const todayStr = new Date().toISOString().split('T')[0];
      const isOverdue = updatedInvoice.dueDate ? updatedInvoice.dueDate < todayStr : false;

      const debtStatus: Debt['status'] =
        updatedInvoice.remainingAmount === 0
          ? 'paid'
          : updatedInvoice.paidAmount > 0
          ? 'partial'
          : isOverdue
          ? 'overdue'
          : 'unpaid';

      setDebts((prev) =>
        prev.map((d) => {
          if (d.id === updatedInvoice.debtId) {
            return {
              ...d,
              customerId: updatedInvoice.customerId,
              amount: updatedInvoice.totalAmount,
              remainingAmount: updatedInvoice.remainingAmount,
              date: updatedInvoice.date,
              dueDate: updatedInvoice.dueDate || d.dueDate,
              status: debtStatus,
              notes: `فاتورة #${updatedInvoice.invoiceNumber}: ${itemsSummary}${
                updatedInvoice.notes ? ` | ${updatedInvoice.notes}` : ''
              }`,
              updatedAt: nowIso,
            };
          }
          return d;
        })
      );

      // Update in firestore
      try {
        await setDoc(
          doc(db, 'debts', updatedInvoice.debtId),
          cleanForFirestore({
            customerId: updatedInvoice.customerId,
            amount: updatedInvoice.totalAmount,
            remainingAmount: updatedInvoice.remainingAmount,
            date: updatedInvoice.date,
            dueDate: updatedInvoice.dueDate,
            status: debtStatus,
            notes: `فاتورة #${updatedInvoice.invoiceNumber}: ${itemsSummary}${
              updatedInvoice.notes ? ` | ${updatedInvoice.notes}` : ''
            }`,
            updatedAt: nowIso,
          }),
          { merge: true }
        );
      } catch (e) {
        console.error('Update linked debt error:', e);
      }
    }

    try {
      await setDoc(doc(db, 'invoices', id), cleanForFirestore(updatedInvoice), { merge: true });
    } catch (e) {
      console.error('Update invoice firestore error:', e);
    }
  };

  const deleteInvoice = async (id: string, deleteLinkedDebt: boolean = true) => {
    const target = invoices.find((i) => i.id === id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));

    if (target?.debtId && deleteLinkedDebt) {
      setDebts((prev) => prev.filter((d) => d.id !== target.debtId));
      setTransactions((prev) => prev.filter((t) => t.debtId !== target.debtId));
    }

    try {
      await deleteDoc(doc(db, 'invoices', id));
      if (target?.debtId && deleteLinkedDebt) {
        await deleteDoc(doc(db, 'debts', target.debtId));
      }
    } catch (e) {
      console.error('Delete invoice firestore error:', e);
    }
  };

  // Record Payment (Supports single debt, or unified customer total across all old & new debts)
  const recordPayment = async ({
    debtId,
    customerId,
    amount,
    paymentMethod,
    notes,
    paymentDate,
  }: {
    debtId?: string;
    customerId?: string;
    amount: number;
    paymentMethod: Transaction['paymentMethod'];
    notes?: string;
    paymentDate?: string;
  }) => {
    let targetCustomerId = customerId;
    if (!targetCustomerId && debtId) {
      const d = debts.find((x) => x.id === debtId);
      if (d) targetCustomerId = d.customerId;
    }
    if (!targetCustomerId) return;

    // Find all unpaid debts for this customer sorted chronologically (FIFO: oldest debt first)
    const custDebts = debts
      .filter((d) => d.customerId === targetCustomerId && d.remainingAmount > 0)
      .sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());

    if (custDebts.length === 0) return;

    let prioritizedDebts = custDebts;
    if (debtId) {
      const specific = custDebts.find((d) => d.id === debtId);
      if (specific) {
        prioritizedDebts = [specific, ...custDebts.filter((d) => d.id !== debtId)];
      }
    }

    let remainingToPay = amount;
    const updatedDebtsList: Debt[] = [];
    const createdTransactionsList: Transaction[] = [];

    for (const d of prioritizedDebts) {
      if (remainingToPay <= 0) break;
      const payForThisDebt = Math.min(remainingToPay, d.remainingAmount);
      const newRemaining = Math.max(0, d.remainingAmount - payForThisDebt);
      const newStatus: DebtStatus = newRemaining === 0 ? 'paid' : 'partial';
      const updatedDebtItem: Debt = {
        ...d,
        remainingAmount: newRemaining,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      updatedDebtsList.push(updatedDebtItem);
      remainingToPay -= payForThisDebt;

      const tx: Transaction = {
        id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        debtId: d.id,
        customerId: targetCustomerId,
        amount: payForThisDebt,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod,
        notes: notes || '',
        receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
      };
      createdTransactionsList.push(tx);
    }

    setDebts((prev) =>
      prev.map((d) => {
        const found = updatedDebtsList.find((u) => u.id === d.id);
        return found ? found : d;
      })
    );

    setTransactions((prev) => [...createdTransactionsList, ...prev]);

    const cust = customers.find((c) => c.id === targetCustomerId);
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      debtId: custDebts[0]?.id,
      customerId: targetCustomerId,
      title: 'تسجيل عملية أداء على الحساب',
      message: `تم أداء مبلغ ${amount} د.م لحساب ${cust?.name || ''} (تسوية القديم والجديد)`,
      date: new Date().toISOString(),
      read: false,
      type: 'payment',
    };
    setNotifications((prev) => [notif, ...prev]);

    const allSettled = updatedDebtsList.every((d) => d.remainingAmount === 0);
    if (allSettled) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    try {
      for (const ud of updatedDebtsList) {
        await setDoc(doc(db, 'debts', ud.id), cleanForFirestore(ud), { merge: true });
      }
      for (const tx of createdTransactionsList) {
        await setDoc(doc(db, 'transactions', tx.id), cleanForFirestore(tx));
      }
      await setDoc(doc(db, 'notifications', notif.id), cleanForFirestore(notif));
    } catch (e) {
      console.error('Record payment firestore error:', e);
    }
  };

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    let updatedDebt: Debt | null = null;
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== tx.debtId) return d;
        const restoredRemaining = Math.min(d.amount, d.remainingAmount + tx.amount);
        const newStatus = restoredRemaining === d.amount ? 'unpaid' : 'partial';
        updatedDebt = { ...d, remainingAmount: restoredRemaining, status: newStatus, updatedAt: new Date().toISOString() };
        return updatedDebt;
      })
    );
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteDoc(doc(db, 'transactions', id));
      if (updatedDebt) {
        await setDoc(doc(db, 'debts', tx.debtId), cleanForFirestore(updatedDebt), { merge: true });
      }
    } catch (e) {
      console.error('Delete transaction firestore error:', e);
    }
  };

  // Config & Security
  const updateConfig = async (updates: Partial<AppConfig>) => {
    const newCfg = { ...config, ...updates };
    setConfig(newCfg);
    try {
      await setDoc(doc(db, 'settings', 'config'), cleanForFirestore(newCfg), { merge: true });
    } catch (e) {
      console.error('Update config firestore error:', e);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const newProf = { ...userProfile, ...updates };
    setUserProfile(newProf);
    try {
      await setDoc(doc(db, 'settings', 'profile'), cleanForFirestore(newProf), { merge: true });
    } catch (e) {
      console.error('Update profile firestore error:', e);
    }
  };

  const markNotificationRead = async (id?: string) => {
    if (id) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      try {
        await setDoc(doc(db, 'notifications', id), { read: true }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      notifications.forEach((n) => {
        setDoc(doc(db, 'notifications', n.id), { read: true }, { merge: true }).catch(console.error);
      });
    }
  };

  const lockApp = () => {
    setConfig((prev) => ({ ...prev, isLocked: true }));
  };

  const unlockApp = (pin: string) => {
    const validPin = config.pinCode || '1234';
    if (validPin === pin) {
      setConfig((prev) => ({ ...prev, isLocked: false }));
      return true;
    }
    return false;
  };

  const setPinCode = (pin: string) => {
    updateConfig({ pinCode: pin });
  };

  // Backup & Reset
  const exportDataJSON = () => {
    const dump = {
      customers,
      debts,
      transactions,
      invoices,
      notifications,
      config,
      userProfile,
      exportDate: new Date().toISOString(),
      version: '2.0',
    };
    const jsonStr = JSON.stringify(dump, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CreditManager_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.customers && parsed.debts) {
        setCustomers(parsed.customers);
        setDebts(parsed.debts);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.userProfile) setUserProfile(parsed.userProfile);

        // Upload to Firestore
        parsed.customers.forEach((c: Customer) => setDoc(doc(db, 'customers', c.id), cleanForFirestore(c)).catch(console.error));
        parsed.debts.forEach((d: Debt) => setDoc(doc(db, 'debts', d.id), cleanForFirestore(d)).catch(console.error));
        if (parsed.transactions) parsed.transactions.forEach((t: Transaction) => setDoc(doc(db, 'transactions', t.id), cleanForFirestore(t)).catch(console.error));
        if (parsed.invoices) parsed.invoices.forEach((inv: Invoice) => setDoc(doc(db, 'invoices', inv.id), cleanForFirestore(inv)).catch(console.error));
        if (parsed.notifications) parsed.notifications.forEach((n: NotificationItem) => setDoc(doc(db, 'notifications', n.id), cleanForFirestore(n)).catch(console.error));
        if (parsed.config) setDoc(doc(db, 'settings', 'config'), cleanForFirestore(parsed.config)).catch(console.error);
        if (parsed.userProfile) setDoc(doc(db, 'settings', 'profile'), cleanForFirestore(parsed.userProfile)).catch(console.error);

        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetAllData = async () => {
    setCustomers(initialCustomers);
    setDebts(initialDebts);
    setTransactions(initialTransactions);
    setInvoices(initialInvoices);
    setNotifications(initialNotifications);
    setConfig(defaultConfig);
    setUserProfile(defaultProfile);
    localStorage.clear();

    try {
      initialCustomers.forEach((c) => setDoc(doc(db, 'customers', c.id), cleanForFirestore(c)).catch(console.error));
      initialDebts.forEach((d) => setDoc(doc(db, 'debts', d.id), cleanForFirestore(d)).catch(console.error));
      initialTransactions.forEach((t) => setDoc(doc(db, 'transactions', t.id), cleanForFirestore(t)).catch(console.error));
      initialInvoices.forEach((inv) => setDoc(doc(db, 'invoices', inv.id), cleanForFirestore(inv)).catch(console.error));
      initialNotifications.forEach((n) => setDoc(doc(db, 'notifications', n.id), cleanForFirestore(n)).catch(console.error));
      setDoc(doc(db, 'settings', 'config'), cleanForFirestore(defaultConfig)).catch(console.error);
      setDoc(doc(db, 'settings', 'profile'), cleanForFirestore(defaultProfile)).catch(console.error);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerSync = () => {
    setConfig((prev) => ({ ...prev, lastSyncDate: new Date().toISOString() }));
  };

  return (
    <CreditManagerContext.Provider
      value={{
        customers,
        debts,
        transactions,
        invoices,
        notifications,
        config,
        userProfile,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedCustomerId,
        setSelectedCustomerId,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addDebt,
        updateDebt,
        deleteDebt,
        consolidateCustomerDebts,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        recordPayment,
        deleteTransaction,
        updateConfig,
        updateUserProfile,
        markNotificationRead,
        lockApp,
        unlockApp,
        setPinCode,
        exportDataJSON,
        importDataJSON,
        resetAllData,
        triggerSync,
      }}
    >
      {children}
    </CreditManagerContext.Provider>
  );
};

export const useCreditManager = () => {
  const context = useContext(CreditManagerContext);
  if (!context) {
    throw new Error('useCreditManager must be used within a CreditManagerProvider');
  }
  return context;
};
