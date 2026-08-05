import { Currency, Language } from '../types/creditManager';

export const formatCurrency = (amount: number, currency: Currency = 'MAD', lang: Language = 'ar'): string => {
  const formattedNumber = new Intl.NumberFormat(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  switch (currency) {
    case 'MAD':
      return lang === 'ar' ? `${formattedNumber} د.م.` : `${formattedNumber} MAD`;
    case 'EUR':
      return `${formattedNumber} €`;
    case 'USD':
    default:
      return `$${formattedNumber}`;
  }
};

export const formatDate = (dateString: string, lang: Language = 'ar'): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const daysUntil = (dueDateString: string): number => {
  if (!dueDateString) return 999;
  const due = new Date(dueDateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/[^\d+]/g, '');
};

export const getWhatsAppUrl = (phone: string, text: string): string => {
  let cleaned = cleanPhoneNumber(phone);
  // Default Moroccan country code if local 06 / 07 number
  if (cleaned.startsWith('0')) {
    cleaned = '212' + cleaned.substring(1);
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
};

export const getCallUrl = (phone: string): string => {
  return `tel:${cleanPhoneNumber(phone)}`;
};

export const getSmsUrl = (phone: string): string => {
  return `sms:${cleanPhoneNumber(phone)}`;
};

// Export table to CSV file with UTF-8 BOM for Arabic support in Excel
export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent =
    '\uFEFF' + // UTF-8 BOM
    [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join(
      '\n'
    );

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
