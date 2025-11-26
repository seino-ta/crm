import { format, parseISO } from 'date-fns';

export function formatCurrency(value?: string | number | null, currency = 'JPY', locale = 'ja-JP') {
  if (value === undefined || value === null) return '—';
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) return '—';
  const isZeroDecimal = currency === 'JPY';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: isZeroDecimal ? 0 : undefined,
    maximumFractionDigits: isZeroDecimal ? 0 : undefined,
  }).format(amount);
}

export function formatNumber(value?: number | string | null, locale = 'ja-JP') {
  if (value === undefined || value === null) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString(locale);
}

export function formatPercent(value?: number | null) {
  if (value === undefined || value === null) return '—';
  return `${value}%`;
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'yyyy/MM/dd');
  } catch {
    return value;
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  try {
    return format(parseISO(value), 'yyyy/MM/dd HH:mm');
  } catch {
    return value;
  }
}

export function formatUserName(firstName?: string | null, lastName?: string | null, fallback?: string | null) {
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return name || fallback || '—';
}
