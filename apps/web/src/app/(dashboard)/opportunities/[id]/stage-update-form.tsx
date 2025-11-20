'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { PipelineStage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { SuccessToast } from '@/components/ui/success-modal';

export function StageUpdateForm({
  action,
  stages,
  defaultStageId,
}: {
  action: (state: { ok?: boolean; error?: string } | undefined, formData: FormData) => Promise<{ ok?: boolean; error?: string } | void>;
  stages: PipelineStage[];
  defaultStageId: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, undefined);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      setShowModal(true);
      const timer = setTimeout(() => setShowModal(false), 2000);
      router.refresh();
      return () => clearTimeout(timer);
    }
  }, [state, router]);

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
      <SuccessToast open={showModal} message="ステージを更新しました。" />
      {state?.error && <p className="text-xs text-rose-600 text-center">{state.error}</p>}
    </form>
  );
}
