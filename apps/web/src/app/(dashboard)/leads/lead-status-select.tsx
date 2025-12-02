'use client';

import { useTransition } from 'react';

import { updateLeadStatusAction } from '@/lib/actions/leads';
import { getLeadStatusOptions, getLeadStatusMeta } from '@/lib/labels';
import { useI18n } from '@/components/providers/i18n-provider';
import { StatusBadge } from '@/components/ui/status-badge';

type LeadStatusSelectProps = {
  leadId: string;
  status: string;
};

export function LeadStatusSelect({ leadId, status }: LeadStatusSelectProps) {
  const { locale } = useI18n('leads');
  const [isPending, startTransition] = useTransition();
  const options = getLeadStatusOptions(locale);
  const { label, tone } = getLeadStatusMeta(status as any, locale);

  return (
    <div className="flex items-center gap-2" data-testid="lead-status">
      <StatusBadge label={label} tone={tone} />
      <select
        className="rounded-md border border-slate-200 px-2 py-1 text-sm"
        defaultValue={status}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.value;
          startTransition(async () => {
            await updateLeadStatusAction(leadId, next);
          });
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
