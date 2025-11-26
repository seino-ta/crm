import { TaskForm } from './task-form';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listOpportunities, listTasks } from '@/lib/data';
import { formatDate, formatUserName } from '@/lib/formatters';
import { getTaskStatusMeta } from '@/lib/labels';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card } from '@/components/ui/card';
import { DeleteTaskButton } from '@/components/tasks/delete-task-button';
import { TaskStatusToggleButton } from '@/components/tasks/task-status-toggle-button';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function TasksPage() {
  const { locale, t } = await getServerTranslations('tasks');
  const user = await getCurrentUser();
  const [tasks, accounts, opportunities] = await Promise.all([
    listTasks({ pageSize: 30 }),
    listAccounts({ pageSize: 100 }),
    listOpportunities({ pageSize: 100 }),
  ]);

  return (
    <div className="space-y-8" data-testid="tasks-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
        <Card>
          <h2 className="text-lg font-semibold">{t('list.title')}</h2>
          <div className="mt-4 space-y-3">
            {tasks.data.length === 0 && <p className="text-sm text-slate-500">{t('list.empty')}</p>}
            {tasks.data.map((task) => {
              const { label, tone } = getTaskStatusMeta(task.status, locale);
              const dueText = task.dueDate ? t('list.dueLabel', { date: formatDate(task.dueDate) }) : t('list.noDueLabel');
              return (
                <div key={task.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm " data-testid="task-row">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{task.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <StatusBadge label={label} tone={tone} />
                        <span>{dueText}</span>
                      </div>
                      <p className="text-xs text-slate-400">{formatUserName(task.owner?.firstName, task.owner?.lastName, task.owner?.email)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TaskStatusToggleButton taskId={task.id} status={task.status} />
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
          <h2 className="text-lg font-semibold">{t('form.title')}</h2>
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
