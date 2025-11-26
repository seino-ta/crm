'use client';

import { useActionState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import type { PipelineStage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { SuccessToast } from '@/components/ui/success-modal';
import { useI18n } from '@/components/providers/i18n-provider';
import type { OpportunityStageActionState } from '@/lib/actions/opportunities';
import { getPipelineStageLabel } from '@/lib/labels';
import { useFormSuccessToast } from '@/hooks/use-form-success-toast';

export function StageUpdateForm({
  action,
  stages,
  defaultStageId,
  formKey,
}: {
  action: (state: OpportunityStageActionState | undefined, formData: FormData) => Promise<OpportunityStageActionState | void>;
  stages: PipelineStage[];
  defaultStageId: string;
  formKey: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<OpportunityStageActionState | undefined, FormData>(action, undefined);
  const { t: tToasts } = useI18n('toasts');
  const { t, locale } = useI18n('opportunities.detail');
  const { t: tErrors } = useI18n('opportunities.errors');
  const stageOptions = useMemo(() => stages.map((stage) => ({ id: stage.id, name: getPipelineStageLabel(stage.name, locale) })), [stages, locale]);
  const initialSnapshot = useMemo(() => JSON.stringify({ stageId: defaultStageId }), [defaultStageId]);
  const { toastTrigger, handleSubmitSnapshot, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast } = useFormSuccessToast({
    formId: `opportunity-stage:${formKey}`,
    initialSnapshot,
    matchInitialSnapshot: true,
    message: tToasts('stageUpdated'),
  });
  const successToastTrigger = toastTrigger ?? undefined;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      triggerImmediateToast();
      handleSuccessPersist();
      setTimeout(() => {
        router.refresh();
      }, 0);
    } else if (state.error) {
      handleErrorCleanup();
    }
  }, [state, router, handleSuccessPersist, handleErrorCleanup, triggerImmediateToast]);

  return (
    <form
      action={formAction}
      className="space-y-2"
      data-testid="opportunity-stage-form"
      onSubmit={(event) => {
        const snapshot = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries()));
        handleSubmitSnapshot(snapshot);
      }}
    >
      <Select name="stageId" defaultValue={defaultStageId}>
        {stageOptions.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="primary" size="sm" className="w-full">
        {t('stageUpdateAction')}
      </Button>
      <SuccessToast trigger={successToastTrigger} message={tToasts('stageUpdated')} />
      {state?.error && <p className="text-xs text-rose-600 text-center">{tErrors(state.error)}</p>}
    </form>
  );
}
