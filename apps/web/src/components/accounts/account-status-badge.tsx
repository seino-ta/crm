'use client';

import { useAccountStatus } from './account-status-context';
import { StatusBadge } from '@/components/ui/status-badge';
import { getAccountStatusMeta } from '@/lib/labels';
import type { Locale } from '@/lib/i18n/config';

export function AccountStatusBadge({ locale }: { locale: Locale }) {
  const ctx = useAccountStatus();
  if (!ctx) {
    return null;
  }
  const { label, tone } = getAccountStatusMeta(ctx.status, locale);
  return <StatusBadge label={label} tone={tone} />;
}
