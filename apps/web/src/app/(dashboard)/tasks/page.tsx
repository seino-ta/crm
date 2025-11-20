import { TaskForm } from './task-form';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listOpportunities, listTasks } from '@/lib/data';
import { formatDateTime, formatUserName } from '@/lib/formatters';
import { getTaskStatusMeta } from '@/lib/labels';
import { StatusBadge } from '@/components/ui/status-badge';
import { toggleTaskStatusAction } from '@/lib/actions/tasks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteTaskButton } from '@/components/tasks/delete-task-button';

export default async function TasksPage() {
  const user = await getCurrentUser();
  const [tasks, accounts, opportunities] = await Promise.all([
    listTasks({ pageSize: 30 }),
    listAccounts({ pageSize: 100 }),
    listOpportunities({ pageSize: 100 }),
  ]);

  return (
    <div className="space-y-8" data-testid="tasks-page">
      <div className="page-header">
        <h1>タスク</h1>
        <p>案件に紐づくフォローアップを時系列で追跡します。</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
        <Card>
          <h2 className="text-lg font-semibold">全タスク</h2>
          <div className="mt-4 space-y-3">
            {tasks.data.map((task) => {
              const toggle = toggleTaskStatusAction.bind(null, task.id, task.status);
              return (
                <div key={task.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900" data-testid="task-row">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{task.title}</p>
                      {(() => {
                        const { label, tone } = getTaskStatusMeta(task.status);
                        return (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <StatusBadge label={label} tone={tone} />
                            <span>{task.dueDate ? formatDateTime(task.dueDate) : '期限未設定'}</span>
                          </div>
                        );
                      })()}
                      <p className="text-xs text-slate-400">
                        {formatUserName(task.owner?.firstName, task.owner?.lastName, task.owner?.email)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={toggle}>
                        <Button
                          type="submit"
                          size="sm"
                          variant={task.status === 'COMPLETED' ? 'secondary' : 'primary'}
                          data-testid="task-toggle"
                        >
                          {task.status === 'COMPLETED' ? '再オープン' : '完了にする'}
                        </Button>
                      </form>
                      <DeleteTaskButton taskId={task.id} />
                    </div>
                  </div>
                  {task.description && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">タスク作成</h2>
          <TaskForm
            ownerId={user.id}
            accounts={accounts.data.map((account) => ({ id: account.id, name: account.name }))}
            opportunities={opportunities.data.map((opp) => ({ id: opp.id, name: opp.name }))}
          />
        </Card>
      </div>
    </div>
  );
}
