'use client';

import { useActionState } from 'react';

import { createActivityAction } from '@/lib/actions/activities';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const types = ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'OTHER'];

type ActivityFormProps = {
  accounts: { id: string; name: string }[];
  opportunities: { id: string; name: string }[];
  userId: string;
};

export function ActivityForm({ accounts, opportunities, userId }: ActivityFormProps) {
  const [state, formAction] = useActionState(createActivityAction, undefined);

  return (
    <form action={formAction} className="space-y-4" data-testid="activity-form">
      <Select name="type" defaultValue="CALL">
        {types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </Select>
      <Input name="subject" placeholder="件名" required />
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
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <Button type="submit" className="w-full">
        活動を追加
      </Button>
    </form>
  );
}
