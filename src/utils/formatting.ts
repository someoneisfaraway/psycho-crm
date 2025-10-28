import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Format date for display
 */
export const formatDate = (
  date: string | Date,
  formatStr: string = 'd MMMM yyyy',
  options?: { locale?: any }
): string => {
 try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: ru, ...options });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '—';
  }
};

/**
 * Format relative time (e.g., "2 дня назад")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { locale: ru, addSuffix: true });
  } catch (error) {
    return '—';
  }
};

/**
 * Format currency (Russian Rubles)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
 const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  }
  
  return phone;
};

/**
 * Pluralize Russian words
 */
export const pluralize = (
  count: number,
  one: string,
  few: string,
  many: string
): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few;
  }
  
  return many;
};

/**
 * Truncate text
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};