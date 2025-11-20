'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createOpportunityAction } from '@/lib/actions/opportunities';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { getPipelineStageLabel } from '@/lib/labels';
import { RequiredMark } from '@/components/ui/required-mark';

export type OpportunityFormProps = {
  accounts: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  ownerId: string;
};

export function OpportunityForm({ accounts, stages, contacts, ownerId }: OpportunityFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<{ ok?: boolean; error?: string } | undefined, FormData>(createOpportunityAction, undefined);
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
    <form action={formAction} className="space-y-4" data-testid="opportunity-form">
      <div className="space-y-1">
        <label htmlFor="opportunity-name" className="text-sm font-medium text-slate-600">
          案件名<RequiredMark />
        </label>
        <Input id="opportunity-name" name="name" placeholder="案件名" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="opportunity-account" className="text-sm font-medium text-slate-600">
            アカウント<RequiredMark />
          </label>
          <Select id="opportunity-account" name="accountId" required defaultValue="">
            <option value="" disabled>
              アカウントを選択
            </option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label htmlFor="opportunity-stage" className="text-sm font-medium text-slate-600">
            ステージ<RequiredMark />
          </label>
          <Select id="opportunity-stage" name="stageId" required defaultValue="">
            <option value="" disabled>
              ステージを選択
            </option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {getPipelineStageLabel(stage.name)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="amount" type="number" min={0} placeholder="金額" />
        <Input name="probability" type="number" min={0} max={100} placeholder="確度(%)" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Input name="expectedCloseDate" type="date" />
        <Select name="contactId" defaultValue="">
          <option value="">コンタクトなし</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name}
            </option>
          ))}
        </Select>
      </div>
      <Textarea name="description" rows={3} placeholder="メモ" />
      <input type="hidden" name="ownerId" value={ownerId} />
      <SuccessToast open={showModal} message="案件を登録しました。" />
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <Button type="submit" className="w-full">
        案件を登録
      </Button>
    </form>
  );
}
