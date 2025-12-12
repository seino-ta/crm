import { ActivityForm } from './activity-form';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listActivities, listOpportunities } from '@/lib/data';
import { formatDateTime, formatUserName } from '@/lib/formatters';
import { getActivityTypeLabel } from '@/lib/labels';
import { DeleteActivityButton } from '@/components/activities/delete-activity-button';
import { Card } from '@/components/ui/card';
import { PageSizeSelector, PaginationBar, PaginationBarLite } from '@/components/ui/pagination-controls';
import { getServerTranslations } from '@/lib/i18n/server';
import { FloatingInput } from '@/components/ui/floating-field';
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
  const requestedPageSize = Number(extractParam(filters, 'pageSize') || '20');
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 20;
  const requestedPage = Number(extractParam(filters, 'page') || '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;
  const tCommon = createTranslator(messages, 'common');

  const [activities, accounts, opportunities] = await Promise.all([
    listActivities({ ...(search ? { search } : {}), page, pageSize }),
    listAccounts({ pageSize: 100 }),
    listOpportunities({ pageSize: 100 }),
  ]);

  const hasPrev = (activities.meta?.page ?? 1) > 1;
  const hasNext = activities.meta ? activities.meta.page < activities.meta.totalPages : false;
  const isLongList = (activities.meta?.totalPages ?? 1) > 2;
  const totalPages = activities.meta?.totalPages ?? 1;
  const total = activities.meta?.total;
  const listSummary =
    total !== undefined
      ? tCommon('listSummaryWithTotal', { values: { total, pageSize } })
      : tCommon('listSummaryPageSizeOnly', { values: { pageSize } });

  if (page > totalPages) {
    return redirect(buildPageHref(totalPages));
  }

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', targetPage.toString());
    params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return qs ? `/activities?${qs}` : '/activities';
  };

  return (
    <ListPageLayout
      title={t('title')}
      description={t('description')}
      data-testid="activities-page"
      searchSection={
        <ListSearchCard
          action="/activities"
          submitLabel={tCommon('search')}
          clearLabel={tCommon('clear') ?? 'Clear'}
          clearHref="/activities"
        >
          <FloatingInput name="search" label={tCommon('search')} defaultValue={search} />
        </ListSearchCard>
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
                hiddenFields={{ search }}
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
