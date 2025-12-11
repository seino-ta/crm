import Link from 'next/link';

import { OpportunityForm } from './opportunity-form';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listContacts, listOpportunities, listPipelineStages } from '@/lib/data';
import { formatCurrency, formatDate, formatUserName } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { FloatingInput } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
import { PageSizeSelector, PaginationBar, PaginationBarLite } from '@/components/ui/pagination-controls';
import { getPipelineStageLabel } from '@/lib/labels';
import { getServerTranslations } from '@/lib/i18n/server';
import { createTranslator } from '@/lib/i18n/translator';

function extractParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, t, messages } = await getServerTranslations('opportunities');
  const user = await getCurrentUser();
  const params = await searchParams;
  const search = extractParam(params, 'search');
  const requestedPageSize = Number(extractParam(params, 'pageSize') || '20');
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 20;
  const requestedPage = Number(extractParam(params, 'page') || '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;
  const tCommon = createTranslator(messages, 'common');

  const [boardOpportunities, tableOpportunities, accounts, stages, contacts] = await Promise.all([
    listOpportunities({ pageSize: 200 }),
    listOpportunities({
      ...(search ? { search } : {}),
      page,
      pageSize,
    }),
    listAccounts({ pageSize: 200 }),
    listPipelineStages(),
    listContacts({ pageSize: 200 }),
  ]);

  const contactOptions = contacts.data.map((contact) => ({ id: contact.id, name: `${contact.firstName} ${contact.lastName}`.trim() }));
  const grouped = stages.map((stage) => ({
    stage,
    items: boardOpportunities.data.filter((opp) => opp.stageId === stage.id),
  }));

  const hasPrev = (tableOpportunities.meta?.page ?? 1) > 1;
  const hasNext = tableOpportunities.meta ? tableOpportunities.meta.page < tableOpportunities.meta.totalPages : false;
  const isLongList = (tableOpportunities.meta?.totalPages ?? 1) > 2;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', targetPage.toString());
    params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return qs ? `/opportunities?${qs}` : '/opportunities';
  };

  return (
    <div className="space-y-10" data-testid="opportunities-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <h2 className="text-lg font-semibold">{t('boardTitle')}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {grouped.map(({ stage, items }) => (
              <div key={stage.id} className="rounded-2xl border border-slate-100 bg-white p-4 " data-testid="opportunity-stage">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 ">{getPipelineStageLabel(stage.name, locale)}</p>
                  <span className="text-xs app-table-muted">{t('boardCount', { values: { count: items.length.toString() } })}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {items.map((opp) => (
                    <Link key={opp.id} href={`/opportunities/${opp.id}`} className="block rounded-xl bg-white p-3 shadow-sm transition hover:ring-2 hover:ring-blue-200 ">
                      <p className="text-sm font-semibold app-link-accent">{opp.name}</p>
                      <p className="text-xs app-table-muted">
                        {opp.account?.name ?? '—'} ・ {formatCurrency(opp.amount)}
                      </p>
                      <p className="text-xs app-table-muted">
                        {formatUserName(opp.owner?.firstName, opp.owner?.lastName, opp.owner?.email)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{t('addTitle')}</h2>
          <OpportunityForm
            accounts={accounts.data.map((account) => ({ id: account.id, name: account.name }))}
            stages={stages}
            contacts={contactOptions}
            ownerId={user.id}
          />
        </Card>
      </div>
        <Card>
          <h2 className="text-lg font-semibold">{t('tableTitle')}</h2>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <form className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]" action="/opportunities" method="get">
              <input type="hidden" name="page" value="1" />
              <FloatingInput name="search" label={tCommon('search')} defaultValue={search} />
              <div className="flex items-end justify-end">
                <Button type="submit" variant="primary" size="sm">
                  {tCommon('search')}
                </Button>
              </div>
            </form>
            <div className="flex items-center justify-end">
              <PageSizeSelector
                action="/opportunities"
                pageSize={pageSize}
                hiddenFields={{ search }}
                label={locale === 'ja' ? '最大表示数' : 'Max rows'}
              />
            </div>
          </div>
          {isLongList && (
            <div className="mt-4">
              <PaginationBarLite
                page={tableOpportunities.meta?.page ?? 1}
                totalPages={tableOpportunities.meta?.totalPages ?? 1}
                prevHref={hasPrev ? buildPageHref((tableOpportunities.meta?.page ?? 1) - 1) : null}
                nextHref={hasNext ? buildPageHref((tableOpportunities.meta?.page ?? 1) + 1) : null}
                prevLabel={locale === 'ja' ? '前へ' : 'Prev'}
                nextLabel={locale === 'ja' ? '次へ' : 'Next'}
              />
            </div>
          )}
          <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-2 py-1 text-left app-table-muted uppercase">{t('table.name')}</th>
                <th className="px-2 py-1 text-left app-table-muted uppercase">{t('table.account')}</th>
                <th className="px-2 py-1 text-left app-table-muted uppercase">{t('table.owner')}</th>
                <th className="px-2 py-1 text-left app-table-muted uppercase">{t('table.stage')}</th>
                <th className="px-2 py-1 text-right app-table-muted uppercase">{t('table.amount')}</th>
                <th className="px-2 py-1 text-left app-table-muted uppercase">{t('table.closeDate')}</th>
              </tr>
            </thead>
            <tbody>
              {tableOpportunities.data.map((opp) => (
                <tr key={opp.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-semibold app-link-accent">
                    <a href={`/opportunities/${opp.id}`} data-testid="opportunity-link">
                      {opp.name}
                    </a>
                  </td>
                  <td className="px-2 py-2 app-table-cell">{opp.account?.name ?? '—'}</td>
                  <td className="px-2 py-2 app-table-cell">{formatUserName(opp.owner?.firstName, opp.owner?.lastName, opp.owner?.email)}</td>
                  <td className="px-2 py-2 app-table-cell">{getPipelineStageLabel(opp.stage?.name, locale)}</td>
                  <td className="px-2 py-2 text-right font-mono app-table-cell">{formatCurrency(opp.amount)}</td>
                  <td className="px-2 py-2 app-table-cell">{formatDate(opp.expectedCloseDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={tableOpportunities.meta?.page ?? 1}
          totalPages={tableOpportunities.meta?.totalPages ?? 1}
          prevHref={hasPrev ? buildPageHref((tableOpportunities.meta?.page ?? 1) - 1) : null}
          nextHref={hasNext ? buildPageHref((tableOpportunities.meta?.page ?? 1) + 1) : null}
          pageLabel={locale === 'ja' ? 'ページ' : 'Page'}
          prevLabel={locale === 'ja' ? '前へ' : 'Prev'}
          nextLabel={locale === 'ja' ? '次へ' : 'Next'}
        />
      </Card>
    </div>
  );
}
