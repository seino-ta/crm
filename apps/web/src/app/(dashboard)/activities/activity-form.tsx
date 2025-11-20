'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createActivityAction } from '@/lib/actions/activities';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/ui/success-modal';
import { ACTIVITY_TYPE_OPTIONS } from '@/lib/labels';
import { RequiredMark } from '@/components/ui/required-mark';

type ActivityFormProps = {
  accounts: { id: string; name: string }[];
  opportunities: { id: string; name: string }[];
  userId: string;
};

export function ActivityForm({ accounts, opportunities, userId }: ActivityFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<{ ok?: boolean; error?: string } | undefined, FormData>(createActivityAction, undefined);
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
    <form action={formAction} className="space-y-4" data-testid="activity-form">
      <div className="space-y-1">
        <label htmlFor="activity-type" className="text-sm font-medium text-slate-600">
          活動タイプ<RequiredMark />
        </label>
        <Select id="activity-type" name="type" defaultValue="CALL">
          {ACTIVITY_TYPE_OPTIONS.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <label htmlFor="activity-subject" className="text-sm font-medium text-slate-600">
          件名<RequiredMark />
        </label>
        <Input id="activity-subject" name="subject" placeholder="件名" required />
      </div>
      <Textarea name="description" rows={3} placeholder="詳細" />
      <Select name="accountId" defaultValue="">
        <option value="">アカウントなし</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </Select>
      <Select name="opportunityId" defaultValue="">
        <option value="">案件なし</option>
        {opportunities.map((opp) => (
          <option key={opp.id} value={opp.id}>
            {opp.name}
          </option>
        ))}
      </Select>
      <input type="hidden" name="userId" value={userId} />
      <SuccessToast open={showModal} message="活動を追加しました。" />
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <Button type="submit" className="w-full">
        活動を追加
      </Button>
    </form>
  );
}
