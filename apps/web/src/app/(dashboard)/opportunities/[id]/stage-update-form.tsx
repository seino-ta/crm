'use client';

import { useActionState } from 'react';

import type { PipelineStage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export function StageUpdateForm({
  action,
  stages,
  defaultStageId,
}: {
  action: (state: { ok?: boolean; error?: string } | undefined, formData: FormData) => Promise<{ ok?: boolean; error?: string } | void>;
  stages: PipelineStage[];
  defaultStageId: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-2" data-testid="opportunity-stage-form">
      <Select name="stageId" defaultValue={defaultStageId}>
        {stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="primary" size="sm" className="w-full">
        ステージを更新
      </Button>
      {state?.ok && <p className="text-xs text-emerald-600 text-center">更新しました。</p>}
      {state?.error && <p className="text-xs text-rose-600 text-center">{state.error}</p>}
    </form>
  );
}
