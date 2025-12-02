'use client';

import { useTransition } from 'react';

import { deleteLeadAction } from '@/lib/actions/leads';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/components/providers/i18n-provider';

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const { t } = useI18n('leads.actions');
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      className="shadow-sm"
      aria-label={t('delete')}
      disabled={isPending}
      onClick={() => {
        if (!confirm(t('deleteConfirm'))) return;
        startTransition(async () => {
          await deleteLeadAction(leadId);
        });
      }}
    >
      {t('delete')}
    </Button>
  );
}
