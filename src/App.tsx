import React, { useState } from 'react';
import { CreditManagerProvider, useCreditManager } from './context/CreditManagerContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/CustomerList';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { DebtList } from './components/DebtList';
import { AddDebtModal } from './components/AddDebtModal';
import { AddCustomerModal } from './components/AddCustomerModal';
import { PaymentModal } from './components/PaymentModal';
import { TransactionsList } from './components/TransactionsList';
import { ReportsView } from './components/ReportsView';
import { BackupSecurityModal } from './components/BackupSecurityModal';
import { ProfileSettings } from './components/ProfileSettings';
import { NotificationsModal } from './components/NotificationsModal';
import { LockScreen } from './components/LockScreen';
import { Customer, Debt } from './types/creditManager';

const AppContent: React.FC = () => {
  const { activeTab, selectedCustomerId, setSelectedCustomerId } = useCreditManager();

  // Modals state
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);
  const [addDebtCustomerId, setAddDebtCustomerId] = useState<string | undefined>(undefined);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDebtId, setPaymentDebtId] = useState<string | undefined>(undefined);
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | undefined>(undefined);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Handlers for Add/Edit Debt
  const handleOpenAddDebt = (custCustomerId?: string) => {
    setDebtToEdit(null);
    setAddDebtCustomerId(custCustomerId);
    setIsAddDebtOpen(true);
  };

  const handleOpenEditDebt = (debt: Debt) => {
    setDebtToEdit(debt);
    setAddDebtCustomerId(undefined);
    setIsAddDebtOpen(true);
  };

  // Handlers for Add/Edit Customer
  const handleOpenAddCustomer = () => {
    setCustomerToEdit(null);
    setIsAddCustomerOpen(true);
  };

  const handleOpenEditCustomer = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsAddCustomerOpen(true);
  };

  // Handlers for Record Payment
  const handleOpenRecordPayment = (debtId?: string, customerId?: string) => {
    setPaymentDebtId(debtId);
    setPaymentCustomerId(customerId);
    setIsPaymentOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Security Lock Screen */}
      <LockScreen />

      {/* Header Bar */}
      <Header
        onOpenAddDebt={() => handleOpenAddDebt()}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar & Mobile Bottom Navigation */}
        <Navigation />

        {/* Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              onOpenAddDebt={() => handleOpenAddDebt()}
              onOpenAddCustomer={handleOpenAddCustomer}
              onOpenRecordPayment={handleOpenRecordPayment}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerList
              onOpenAddCustomer={handleOpenAddCustomer}
              onEditCustomer={handleOpenEditCustomer}
              onOpenAddDebtForCustomer={(cId) => handleOpenAddDebt(cId)}
              onOpenRecordPaymentForCustomer={(cId) => handleOpenRecordPayment(undefined, cId)}
            />
          )}

          {activeTab === 'debts' && (
            <DebtList
              onOpenAddDebt={() => handleOpenAddDebt()}
              onEditDebt={handleOpenEditDebt}
              onOpenRecordPayment={(dId, cId) => handleOpenRecordPayment(dId, cId)}
            />
          )}

          {activeTab === 'transactions' && <TransactionsList />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'settings' && <BackupSecurityModal />}

          {activeTab === 'profile' && <ProfileSettings />}
        </main>
      </div>

      {/* Modal Overlays */}
      {isAddDebtOpen && (
        <AddDebtModal
          debtToEdit={debtToEdit}
          defaultCustomerId={addDebtCustomerId}
          onClose={() => setIsAddDebtOpen(false)}
        />
      )}

      {isAddCustomerOpen && (
        <AddCustomerModal
          customerToEdit={customerToEdit}
          onClose={() => setIsAddCustomerOpen(false)}
        />
      )}

      {isPaymentOpen && (
        <PaymentModal
          defaultDebtId={paymentDebtId}
          defaultCustomerId={paymentCustomerId}
          onClose={() => setIsPaymentOpen(false)}
        />
      )}

      {selectedCustomerId && (
        <CustomerDetailModal
          onClose={() => setSelectedCustomerId(null)}
          onOpenAddDebtForCustomer={(cId) => handleOpenAddDebt(cId)}
          onOpenRecordPayment={(dId, cId) => handleOpenRecordPayment(dId, cId)}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsModal onClose={() => setIsNotificationsOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <CreditManagerProvider>
      <AppContent />
    </CreditManagerProvider>
  );
}
