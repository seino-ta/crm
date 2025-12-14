import { TaskForm } from './task-form';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listOpportunities, listTasks } from '@/lib/data';
import { formatDate, formatUserName } from '@/lib/formatters';
import { getTaskStatusMeta } from '@/lib/labels';
import { DeleteTaskButton } from '@/components/tasks/delete-task-button';
import { TaskStatusToggleButton } from '@/components/tasks/task-status-toggle-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FloatingInput } from '@/components/ui/floating-field';
import { PageSizeSelector, PaginationBar, PaginationBarLite } from '@/components/ui/pagination-controls';
import { StatusBadge } from '@/components/ui/status-badge';
import { getServerTranslations } from '@/lib/i18n/server';
import { createTranslator } from '@/lib/i18n/translator';
import Link from 'next/link';

function TasksSearchForm({ search, tCommon }: { search: string; tCommon: ReturnType<typeof createTranslator> }) {
  return (
    <form className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]" action="/tasks" method="get">
      <input type="hidden" name="page" value="1" />
      <FloatingInput name="search" label={tCommon('search')} defaultValue={search} />
      <div className="flex items-end justify-end gap-2">
        <Button type="submit" variant="primary" size="sm">
          {tCommon('search')}
        </Button>
        <Link
          href="/tasks"
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          {tCommon('clear') ?? 'Clear'}
        </Link>
      </div>
    </form>
  );
}

function extractParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t, messages } = await getServerTranslations('tasks');
  const user = await getCurrentUser();
  const filters = await searchParams;
  const search = extractParam(filters, 'search');
  const requestedPageSize = Number(extractParam(filters, 'pageSize') || '20');
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 20;
  const requestedPage = Number(extractParam(filters, 'page') || '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;
  const tCommon = createTranslator(messages, 'common');

  const [tasks, accounts, opportunities] = await Promise.all([
    listTasks({
      ...(search ? { search } : {}),
      page,
      pageSize,
    }),
    listAccounts({ pageSize: 100 }),
    listOpportunities({ pageSize: 100 }),
  ]);

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', targetPage.toString());
    params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return qs ? `/tasks?${qs}` : '/tasks';
  };

  const hasPrev = (tasks.meta?.page ?? 1) > 1;
  const hasNext = tasks.meta ? tasks.meta.page < tasks.meta.totalPages : false;
  const totalPages = tasks.meta?.totalPages ?? 1;
  const isLongList = totalPages > 1;
  const total = tasks.meta?.total;
  const listSummary =
    total !== undefined
      ? tCommon('listSummaryWithTotal', { values: { total, pageSize } })
      : tCommon('listSummaryPageSizeOnly', { values: { pageSize } });

  if (page > totalPages) {
    return redirect(buildPageHref(totalPages));
  }

  return (
    <div className="space-y-8" data-testid="tasks-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <Card>
        <TasksSearchForm search={search} tCommon={tCommon} />
      </Card>
      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
        <Card>
          <h2 className="text-lg font-semibold">{t('list.title')}</h2>
          <p className="text-xs text-slate-500">{listSummary}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1" />
            <div className="flex items-center justify-end">
              <PageSizeSelector
                action="/tasks"
                pageSize={pageSize}
                hiddenFields={{ search }}
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
          <PaginationBar
            page={tasks.meta?.page ?? 1}
            totalPages={tasks.meta?.totalPages ?? 1}
            prevHref={hasPrev ? buildPageHref((tasks.meta?.page ?? 1) - 1) : null}
            nextHref={hasNext ? buildPageHref((tasks.meta?.page ?? 1) + 1) : null}
            pageLabel={locale === 'ja' ? 'ページ' : 'Page'}
            prevLabel={locale === 'ja' ? '前へ' : 'Prev'}
            nextLabel={locale === 'ja' ? '次へ' : 'Next'}
          />
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
    </div>
  );
}
