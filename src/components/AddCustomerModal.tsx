import React, { useState } from 'react';
import { X, User, Phone, MapPin, CreditCard, FileText, Camera } from 'lucide-react';
import { useCreditManager } from '../context/CreditManagerContext';
import { Customer } from '../types/creditManager';
import { getTranslation } from '../utils/translations';

interface AddCustomerModalProps {
  customerToEdit?: Customer | null;
  onClose: () => void;
}

const AVATAR_SAMPLES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
];

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ customerToEdit, onClose }) => {
  const { addCustomer, updateCustomer, config } = useCreditManager();
  const t = getTranslation(config.language);

  const [name, setName] = useState<string>(customerToEdit?.name || '');
  const [phone, setPhone] = useState<string>(customerToEdit?.phone || '');
  const [address, setAddress] = useState<string>(customerToEdit?.address || '');
  const [photoUrl, setPhotoUrl] = useState<string>(customerToEdit?.photoUrl || AVATAR_SAMPLES[0]);
  const [notes, setNotes] = useState<string>(customerToEdit?.notes || '');
  const [creditLimit, setCreditLimit] = useState<string>(
    customerToEdit?.creditLimit ? customerToEdit.creditLimit.toString() : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    if (customerToEdit) {
      updateCustomer(customerToEdit.id, {
        name,
        phone,
        address,
        photoUrl,
        notes,
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      });
    } else {
      addCustomer({
        name,
        phone,
        address,
        photoUrl,
        notes,
        creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <h2 className="text-base font-bold">
            {customerToEdit ? t.editCustomer : t.addCustomer}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {t.photo}
            </label>
            <div className="flex items-center gap-3">
              <img
                src={photoUrl}
                alt="Selected Avatar"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/40 shrink-0"
              />
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {AVATAR_SAMPLES.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoUrl(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 shrink-0 transition-all ${
                      photoUrl === url ? 'border-indigo-600 scale-110' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.customerName}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الكامل للزبون أو الشركة..."
                required
                className="w-full ps-9 pe-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.phone}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0612345678"
                required
                className="w-full ps-9 pe-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.address}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="المدينة، الحي أو العنوان..."
                className="w-full ps-9 pe-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* Credit Limit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.creditLimit} ({config.currency})
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute inset-y-0 my-auto start-3 text-slate-400" />
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="مثال: 10000"
                className="w-full ps-9 pe-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.notes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="ملاحظات حول طبيعة المعاملات..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition-all active:scale-95"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
