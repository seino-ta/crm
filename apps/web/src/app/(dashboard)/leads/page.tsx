import Link from 'next/link';

import { DeleteLeadButton } from './delete-lead-button';
import { LeadForm } from './lead-form';
import { LeadStatusSelect } from './lead-status-select';
import { getCurrentUser } from '@/lib/auth';
import { listAccounts, listLeads, listUsers } from '@/lib/data';
import { formatDate, formatUserName } from '@/lib/formatters';
import { getLeadStatusMeta } from '@/lib/labels';
import { getServerTranslations } from '@/lib/i18n/server';
import type { LeadStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-field';
import { ListPageLayout } from '@/components/layout/list-page-layout';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { PageSizeSelector, PaginationBar, PaginationBarLite } from '@/components/ui/pagination-controls';
import { createTranslator } from '@/lib/i18n/translator';

function extractParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

const PAGE_SIZE = 20;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const { locale, t, messages } = await getServerTranslations('leads');
  const tCommon = createTranslator(messages, 'common');
  const user = await getCurrentUser();
  const filters = await searchParams;
  const search = extractParam(filters, 'search');
  const status = extractParam(filters, 'status') as LeadStatus | '';
  const requestedPageSize = Number(extractParam(filters, 'pageSize') || PAGE_SIZE);
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : PAGE_SIZE;
  const requestedPage = Number(extractParam(filters, 'page') || '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

  const ownersPromise =
    user.role === 'ADMIN' || user.role === 'MANAGER'
      ? listUsers({ pageSize: 100 })
      : Promise.resolve({ data: [user] });

  const [{ data: leads, meta }, owners, accounts] = await Promise.all([
    listLeads({
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      page,
      pageSize,
    }),
    ownersPromise,
    listAccounts({ pageSize: 100 }),
  ]);

  const hasPrev = (meta?.page ?? 1) > 1;
  const hasNext = meta ? meta.page < meta.totalPages : false;
  const isLongList = (meta?.totalPages ?? 1) > 2;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total;
  const listSummary =
    total !== undefined
      ? tCommon('listSummaryWithTotal', { values: { total, pageSize } })
      : tCommon('listSummaryPageSizeOnly', { values: { pageSize } });
  const clearHref = '/leads';

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    params.set('page', targetPage.toString());
    params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return qs ? `/leads?${qs}` : '/leads';
  };

  if (page > totalPages) {
    return redirect(buildPageHref(totalPages));
  }

  return (
    <ListPageLayout
      title={t('title')}
      description={t('description')}
      data-testid="leads-page"
      searchSection={
        <Card>
          <form className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]" action="/leads" method="get">
            <input type="hidden" name="page" value="1" />
            <FloatingInput name="search" label={t('filters.searchLabel')} example={t('filters.searchPlaceholder')} defaultValue={search} />
            <FloatingSelect name="status" label={t('filters.status')} defaultValue={status} forceFloatLabel>
              <option value="">{t('filters.statusAll')}</option>
              {['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED'].map((value) => {
                const { label } = getLeadStatusMeta(value as LeadStatus, locale);
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </FloatingSelect>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm">
                {t('filters.submit')}
              </Button>
              <Link
                href={clearHref}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
              >
                {locale === 'ja' ? 'クリア' : 'Clear'}
              </Link>
            </div>
          </form>
        </Card>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
        <Card>
          <h2 className="text-lg font-semibold">{t('list.title')}</h2>
          <ListToolbar
            summary={listSummary}
            right={
              <PageSizeSelector
                action="/leads"
                pageSize={pageSize}
                hiddenFields={{ search, status }}
                label={locale === 'ja' ? '最大表示数' : 'Max rows'}
              />
            }
          />
          {isLongList && (
            <div className="mt-4">
              <PaginationBarLite
                page={meta?.page ?? 1}
                totalPages={meta?.totalPages ?? 1}
                prevHref={hasPrev ? buildPageHref((meta?.page ?? 1) - 1) : null}
                nextHref={hasNext ? buildPageHref((meta?.page ?? 1) + 1) : null}
                prevLabel={locale === 'ja' ? '前へ' : 'Prev'}
                nextLabel={locale === 'ja' ? '次へ' : 'Next'}
              />
            </div>
          )}
          <div className="mt-4 space-y-4">
            {leads.length === 0 && <p className="text-sm text-slate-500">{t('list.empty')}</p>}
            {leads.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm " data-testid="lead-row">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{lead.name}</p>
                    <p className="text-xs text-slate-500">{lead.company || t('list.companyFallback')}</p>
                    <p className="text-xs text-slate-400">{formatUserName(lead.owner?.firstName, lead.owner?.lastName, lead.owner?.email)}</p>
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="text-blue-600 underline">
                          {lead.email}
                        </a>
                      )}
                      {lead.phone && <p>{lead.phone}</p>}
                      {lead.account && (
                        <Link href={`/accounts/${lead.account.id}`} className="text-blue-600">
                          {lead.account.name}
                        </Link>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">{lead.createdAt ? formatDate(lead.createdAt) : '—'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <LeadStatusSelect leadId={lead.id} status={lead.status} />
                    <DeleteLeadButton leadId={lead.id} />
                  </div>
                </div>
                {lead.notes && <p className="mt-2 text-sm text-slate-700">{lead.notes}</p>}
              </div>
            ))}
          </div>
          <PaginationBar
            page={meta?.page ?? 1}
            totalPages={meta?.totalPages ?? 1}
            prevHref={hasPrev ? buildPageHref((meta?.page ?? 1) - 1) : null}
            nextHref={hasNext ? buildPageHref((meta?.page ?? 1) + 1) : null}
            pageLabel={locale === 'ja' ? 'ページ' : 'Page'}
            prevLabel={locale === 'ja' ? '前へ' : 'Prev'}
            nextLabel={locale === 'ja' ? '次へ' : 'Next'}
          />
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{t('form.title')}</h2>
          <LeadForm
            owners={owners.data.map((owner) => ({ id: owner.id, name: formatUserName(owner.firstName, owner.lastName, owner.email) }))}
            accounts={accounts.data.map((account) => ({ id: account.id, name: account.name }))}
            defaultOwnerId={user.id}
          />
        </Card>
      </div>
    </ListPageLayout>
  );
}
