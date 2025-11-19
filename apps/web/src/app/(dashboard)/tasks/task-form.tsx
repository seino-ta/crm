'use client';

import { useFormState } from 'react-dom';

import { createTaskAction } from '@/lib/actions/tasks';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

type TaskFormProps = {
  accounts: { id: string; name: string }[];
  opportunities: { id: string; name: string }[];
  ownerId: string;
};

export function TaskForm({ accounts, opportunities, ownerId }: TaskFormProps) {
  const [state, formAction] = useFormState(createTaskAction, undefined);

  return (
    <form action={formAction} className="space-y-4" data-testid="task-form">
      <Input name="title" placeholder="タスク名" required />
      <Textarea name="description" rows={3} placeholder="詳細" />
      <Select name="priority" defaultValue="MEDIUM">
        {priorities.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </Select>
      <Input name="dueDate" type="date" />
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
      <input type="hidden" name="ownerId" value={ownerId} />
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <Button type="submit" className="w-full">
        タスクを追加
      </Button>
    </form>
  );
}
