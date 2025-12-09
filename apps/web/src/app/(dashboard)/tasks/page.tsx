import { TaskForm } from './task-form';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listOpportunities, listTasks } from '@/lib/data';
import { formatDate, formatUserName } from '@/lib/formatters';
import { getTaskStatusMeta } from '@/lib/labels';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card } from '@/components/ui/card';
import { PageSizeSelector, PaginationBar, PaginationBarLite } from '@/components/ui/pagination-controls';
import { DeleteTaskButton } from '@/components/tasks/delete-task-button';
import { TaskStatusToggleButton } from '@/components/tasks/task-status-toggle-button';
import { getServerTranslations } from '@/lib/i18n/server';

function extractParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t } = await getServerTranslations('tasks');
  const user = await getCurrentUser();
  const filters = await searchParams;
  const requestedPageSize = Number(extractParam(filters, 'pageSize') || '20');
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 20;
  const requestedPage = Number(extractParam(filters, 'page') || '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

  const [tasks, accounts, opportunities] = await Promise.all([
    listTasks({ page, pageSize }),
    listAccounts({ pageSize: 100 }),
    listOpportunities({ pageSize: 100 }),
  ]);

  const hasPrev = (tasks.meta?.page ?? 1) > 1;
  const hasNext = tasks.meta ? tasks.meta.page < tasks.meta.totalPages : false;
  const isLongList = (tasks.meta?.totalPages ?? 1) > 2;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set('page', targetPage.toString());
    params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return qs ? `/tasks?${qs}` : '/tasks';
  };

  return (
    <div className="space-y-8" data-testid="tasks-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
        <Card>
          <h2 className="text-lg font-semibold">{t('list.title')}</h2>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex-1" />
            <div className="flex items-center justify-end">
              <PageSizeSelector
                action="/tasks"
                pageSize={pageSize}
                hiddenFields={{}}
                label={locale === 'ja' ? '最大表示数' : 'Max rows'}
              />
            </div>
          </div>
          {isLongList && (
            <div className="mt-4">
              <PaginationBarLite
                page={tasks.meta?.page ?? 1}
                totalPages={tasks.meta?.totalPages ?? 1}
                prevHref={hasPrev ? buildPageHref((tasks.meta?.page ?? 1) - 1) : null}
                nextHref={hasNext ? buildPageHref((tasks.meta?.page ?? 1) + 1) : null}
                prevLabel={locale === 'ja' ? '前へ' : 'Prev'}
                nextLabel={locale === 'ja' ? '次へ' : 'Next'}
              />
            </div>
          )}
          <div className="mt-4 space-y-3">
            {tasks.data.length === 0 && <p className="text-sm text-slate-500">{t('list.empty')}</p>}
            {tasks.data.map((task) => {
              const { label, tone } = getTaskStatusMeta(task.status, locale);
              const dueText = task.dueDate ? t('list.dueLabel', { values: { date: formatDate(task.dueDate) } }) : t('list.noDueLabel');
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
            opportunities={opportunities.data.map((opp) => ({ id: opp.id, name: opp.name, accountId: opp.accountId }))}
          />
        </Card>
      </div>
      <PaginationBar
        page={tasks.meta?.page ?? 1}
        totalPages={tasks.meta?.totalPages ?? 1}
        prevHref={hasPrev ? buildPageHref((tasks.meta?.page ?? 1) - 1) : null}
        nextHref={hasNext ? buildPageHref((tasks.meta?.page ?? 1) + 1) : null}
        pageLabel={locale === 'ja' ? 'ページ' : 'Page'}
        prevLabel={locale === 'ja' ? '前へ' : 'Prev'}
        nextLabel={locale === 'ja' ? '次へ' : 'Next'}
      />
    </div>
  );
}
