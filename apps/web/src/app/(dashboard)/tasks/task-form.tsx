'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { createTaskAction } from '@/lib/actions/tasks';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TASK_PRIORITY_OPTIONS } from '@/lib/labels';
import { RequiredMark } from '@/components/ui/required-mark';

type TaskFormProps = {
  accounts: { id: string; name: string }[];
  opportunities: { id: string; name: string }[];
  ownerId: string;
};

export function TaskForm({ accounts, opportunities, ownerId }: TaskFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState<{ ok?: boolean; error?: string } | undefined, FormData>(createTaskAction, undefined);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4" data-testid="task-form">
      <div className="space-y-1">
        <label htmlFor="task-title" className="text-sm font-medium text-slate-600">
          タスク名<RequiredMark />
        </label>
        <Input id="task-title" name="title" placeholder="タスク名" required />
      </div>
      <Textarea name="description" rows={3} placeholder="詳細" />
      <div className="space-y-1">
        <label htmlFor="task-priority" className="text-sm font-medium text-slate-600">
          優先度<RequiredMark />
        </label>
        <Select id="task-priority" name="priority" defaultValue="MEDIUM">
          {TASK_PRIORITY_OPTIONS.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </Select>
      </div>
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
      {state?.ok && <p className="text-sm text-emerald-600">保存しました。</p>}
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <Button type="submit" className="w-full">
        タスクを追加
      </Button>
    </form>
  );
}
