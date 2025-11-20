import { format, parseISO } from 'date-fns';

export function formatCurrency(value?: string | number | null, currency = 'JPY') {
  if (value === undefined || value === null) return '—';
  const amount = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(amount)) return '—';
  const isJPY = currency === 'JPY';
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
    minimumFractionDigits: isJPY ? 0 : undefined,
    maximumFractionDigits: isJPY ? 0 : undefined,
  }).format(amount);
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
  return name || fallback || '未設定';
}
