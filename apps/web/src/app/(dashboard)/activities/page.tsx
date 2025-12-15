import { redirect } from 'next/navigation';

import { ActivityForm } from './activity-form';
import { ActivityType } from '@prisma/client';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listActivities, listOpportunities } from '@/lib/data';
import { formatDateTime, formatUserName } from '@/lib/formatters';
import { getActivityTypeLabel } from '@/lib/labels';
import { DeleteActivityButton } from '@/components/activities/delete-activity-button';
import { Card } from '@/components/ui/card';
import { PageSizeSelector, PaginationBar, PaginationBarLite } from '@/components/ui/pagination-controls';
import { getServerTranslations } from '@/lib/i18n/server';
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
import { ListPageLayout } from '@/components/layout/list-page-layout';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { ListSearchCard } from '@/components/ui/list-search-card';
import { createTranslator } from '@/lib/i18n/translator';

function extractParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, t, messages } = await getServerTranslations('activities');
  const user = await getCurrentUser();
  const filters = await searchParams;
  const search = extractParam(filters, 'search');
  const type = extractParam(filters, 'type');
  const from = extractParam(filters, 'from');
  const to = extractParam(filters, 'to');
  const requestedPageSize = Number(extractParam(filters, 'pageSize') || '20');
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 20;
  const requestedPage = Number(extractParam(filters, 'page') || '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;
  const tCommon = createTranslator(messages, 'common');

  const [activities, accounts, opportunities] = await Promise.all([
    listActivities({
      ...(search ? { search } : {}),
      ...(type ? { type: type as ActivityType } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      page,
      pageSize,
    }),
    listAccounts({ pageSize: 100 }),
    listOpportunities({ pageSize: 100 }),
  ]);

  const hasPrev = (activities.meta?.page ?? 1) > 1;
  const hasNext = activities.meta ? activities.meta.page < activities.meta.totalPages : false;
  const totalPages = activities.meta?.totalPages ?? 1;
  const isLongList = totalPages > 1;
  const total = activities.meta?.total;
  const listSummary =
    total !== undefined
      ? tCommon('listSummaryWithTotal', { values: { total, pageSize } })
      : tCommon('listSummaryPageSizeOnly', { values: { pageSize } });

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (type) params.set('type', type);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('page', targetPage.toString());
    params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return qs ? `/activities?${qs}` : '/activities';
  };

  if (page > totalPages) {
    return redirect(buildPageHref(totalPages));
  }

  return (
    <ListPageLayout
      title={t('title')}
      description={t('description')}
      data-testid="activities-page"
      searchSection={
        <Card>
          <form className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_auto]" action="/activities" method="get">
            <input type="hidden" name="page" value="1" />
            <FloatingInput
              name="search"
              label={locale === 'ja' ? 'キーワード' : 'Keyword'}
              example={locale === 'ja' ? '件名で検索' : 'Search by subject'}
              defaultValue={search}
            />
            <FloatingSelect name="type" label={locale === 'ja' ? '活動タイプ' : 'Type'} defaultValue={type} forceFloatLabel>
              <option value="">{locale === 'ja' ? 'すべて' : 'All'}</option>
              {Object.values(ActivityType).map((value) => (
                <option key={value} value={value}>
                  {getActivityTypeLabel(value, locale)}
                </option>
              ))}
            </FloatingSelect>
            <div className="grid grid-cols-2 gap-3">
              <FloatingInput name="from" type="date" label={locale === 'ja' ? '開始日' : 'From'} defaultValue={from} />
              <FloatingInput name="to" type="date" label={locale === 'ja' ? '終了日' : 'To'} defaultValue={to} />
            </div>
            <div className="flex items-end justify-end gap-2">
              <Button type="submit" size="sm">
                {tCommon('search')}
              </Button>
              <Link
                href="/activities"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                {tCommon('clear') ?? 'Clear'}
              </Link>
            </div>
          </form>
        </Card>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
        <Card>
          <h2 className="text-lg font-semibold">{t('tableTitle')}</h2>
          <ListToolbar
            summary={listSummary}
            right={
              <PageSizeSelector
                action="/activities"
                pageSize={pageSize}
                hiddenFields={{ search, type, from, to }}
                label={locale === 'ja' ? '最大表示数' : 'Max rows'}
              />
            }
          />
          {isLongList && (
            <div className="mt-4">
              <PaginationBarLite
                page={activities.meta?.page ?? 1}
                totalPages={activities.meta?.totalPages ?? 1}
                prevHref={hasPrev ? buildPageHref((activities.meta?.page ?? 1) - 1) : null}
                nextHref={hasNext ? buildPageHref((activities.meta?.page ?? 1) + 1) : null}
                prevLabel={locale === 'ja' ? '前へ' : 'Prev'}
                nextLabel={locale === 'ja' ? '次へ' : 'Next'}
              />
            </div>
          )}
          <div className="mt-4 space-y-4">
            {activities.data.length === 0 && <p className="text-sm text-slate-500">{t('emptyMessage')}</p>}
            {activities.data.map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm " data-testid="activity-row">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{activity.subject}</p>
                    <p className="text-xs text-slate-500">
                      {getActivityTypeLabel(activity.type, locale)} ・ {formatDateTime(activity.occurredAt)} ・ {formatUserName(activity.user?.firstName, activity.user?.lastName, activity.user?.email)}
                    </p>
                    {activity.account && <p className="text-xs text-slate-400">{activity.account.name}</p>}
                  </div>
                  <DeleteActivityButton activityId={activity.id} />
                </div>
                {activity.description && <p className="mt-2 text-sm text-slate-600">{activity.description}</p>}
              </div>
            ))}
          </div>
          <PaginationBar
            page={activities.meta?.page ?? 1}
            totalPages={activities.meta?.totalPages ?? 1}
            prevHref={hasPrev ? buildPageHref((activities.meta?.page ?? 1) - 1) : null}
            nextHref={hasNext ? buildPageHref((activities.meta?.page ?? 1) + 1) : null}
            pageLabel={locale === 'ja' ? 'ページ' : 'Page'}
            prevLabel={locale === 'ja' ? '前へ' : 'Prev'}
            nextLabel={locale === 'ja' ? '次へ' : 'Next'}
          />
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{t('form.submit')}</h2>
          <ActivityForm
            userId={user.id}
            accounts={accounts.data.map((account) => ({ id: account.id, name: account.name }))}
            opportunities={opportunities.data.map((opp) => ({ id: opp.id, name: opp.name, accountId: opp.accountId }))}
          />
        </Card>
      </div>
    </ListPageLayout>
  );
}
