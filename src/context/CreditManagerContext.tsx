import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Customer,
  Debt,
  Transaction,
  NotificationItem,
  AppConfig,
  UserProfile,
  Language,
  Currency,
} from '../types/creditManager';

interface CreditManagerContextType {
  customers: Customer[];
  debts: Debt[];
  transactions: Transaction[];
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
  addDebt: (debt: Omit<Debt, 'id' | 'remainingAmount' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;

  // Transactions & Payments
  recordPayment: (payment: {
    debtId: string;
    amount: number;
    paymentMethod: Transaction['paymentMethod'];
    notes?: string;
    paymentDate?: string;
  }) => void;
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
  isLocked: false,
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
      return saved && saved !== 'undefined' ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
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

  // Sync to LocalStorage
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
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    // Also remove customer debts and transactions
    const customerDebtIds = debts.filter((d) => d.customerId === id).map((d) => d.id);
    setDebts((prev) => prev.filter((d) => d.customerId !== id));
    setTransactions((prev) => prev.filter((t) => !customerDebtIds.includes(t.debtId)));
    if (selectedCustomerId === id) setSelectedCustomerId(null);
  };

  // Debt Actions
  const addDebt = (data: Omit<Debt, 'id' | 'remainingAmount' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = data.dueDate < todayStr;
    const newDebt: Debt = {
      ...data,
      id: `debt-${Date.now()}`,
      remainingAmount: data.amount,
      status: isOverdue ? 'overdue' : 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDebts((prev) => [newDebt, ...prev]);
  };

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates, updatedAt: new Date().toISOString() };
        // recalculate status
        if (updated.remainingAmount <= 0) {
          updated.status = 'paid';
          updated.remainingAmount = 0;
        } else if (updated.remainingAmount < updated.amount) {
          updated.status = 'partial';
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          updated.status = updated.dueDate < todayStr ? 'overdue' : 'unpaid';
        }
        return updated;
      })
    );
  };

  const deleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
    setTransactions((prev) => prev.filter((t) => t.debtId !== id));
  };

  // Record Payment
  const recordPayment = ({
    debtId,
    amount,
    paymentMethod,
    notes,
    paymentDate,
  }: {
    debtId: string;
    amount: number;
    paymentMethod: Transaction['paymentMethod'];
    notes?: string;
    paymentDate?: string;
  }) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const actualPayAmount = Math.min(amount, debt.remainingAmount);
    const newRemaining = Math.max(0, debt.remainingAmount - actualPayAmount);
    const newStatus = newRemaining === 0 ? 'paid' : 'partial';

    // Update debt
    setDebts((prev) =>
      prev.map((d) => (d.id === debtId ? { ...d, remainingAmount: newRemaining, status: newStatus, updatedAt: new Date().toISOString() } : d))
    );

    // Create transaction record
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      debtId,
      customerId: debt.customerId,
      amount: actualPayAmount,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod,
      notes: notes || '',
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Add notification
    const cust = customers.find((c) => c.id === debt.customerId);
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      debtId,
      customerId: debt.customerId,
      title: 'تسجيل عملية أداء جديدة',
      message: `تم أداء مبلغ ${actualPayAmount} د.م للزبون ${cust?.name || ''}`,
      date: new Date().toISOString(),
      read: false,
      type: 'payment',
    };
    setNotifications((prev) => [notif, ...prev]);

    // Celebrate with confetti if full payment!
    if (newRemaining === 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    // Restore remaining amount on debt
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== tx.debtId) return d;
        const restoredRemaining = Math.min(d.amount, d.remainingAmount + tx.amount);
        const newStatus = restoredRemaining === d.amount ? 'unpaid' : 'partial';
        return { ...d, remainingAmount: restoredRemaining, status: newStatus, updatedAt: new Date().toISOString() };
      })
    );
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Config & Security
  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  };

  const markNotificationRead = (id?: string) => {
    if (id) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const lockApp = () => {
    setConfig((prev) => ({ ...prev, isLocked: true }));
  };

  const unlockApp = (pin: string) => {
    if (!config.pinCode || config.pinCode === pin) {
      setConfig((prev) => ({ ...prev, isLocked: false }));
      return true;
    }
    return false;
  };

  const setPinCode = (pin: string) => {
    setConfig((prev) => ({ ...prev, pinCode: pin }));
  };

  // Backup & Reset
  const exportDataJSON = () => {
    const dump = {
      customers,
      debts,
      transactions,
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
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.userProfile) setUserProfile(parsed.userProfile);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const resetAllData = () => {
    setCustomers(initialCustomers);
    setDebts(initialDebts);
    setTransactions(initialTransactions);
    setNotifications(initialNotifications);
    setConfig(defaultConfig);
    setUserProfile(defaultProfile);
    localStorage.clear();
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
