import Link from 'next/link';

import { AccountForm } from './account-form';
import { createAccountAction } from '@/lib/actions/accounts';
import { listAccounts } from '@/lib/data';
import { formatCurrency } from '@/lib/formatters';
import { Card } from '@/components/ui/card';
import { FloatingInput } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
import { PageSizeSelector, PaginationBar, PaginationBarLite } from '@/components/ui/pagination-controls';
import { getAccountStatusMeta } from '@/lib/labels';
import { StatusBadge } from '@/components/ui/status-badge';
import { RestoreAccountButton } from '@/components/accounts/restore-account-button';
import { getServerTranslations } from '@/lib/i18n/server';
import { createTranslator } from '@/lib/i18n/translator';

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params?.search === 'string' ? params.search : '';
  const view = typeof params?.view === 'string' && params.view === 'archived' ? 'archived' : 'active';
  const requestedPageSize = Number(params?.pageSize ?? '20');
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 20;
  const requestedPage = Number(params?.page ?? '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;
  const { locale, messages, t } = await getServerTranslations('accounts');
  const { data: accounts, meta } = await listAccounts({
    search,
    page,
    pageSize,
    archived: view === 'archived',
  });
  const tCommon = createTranslator(messages, 'common');
  const tTable = createTranslator(messages, 'accounts.table');
  const tForm = createTranslator(messages, 'accounts.form');

  const buildViewHref = (nextView: 'active' | 'archived') => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    query.set('pageSize', String(pageSize));
    if (nextView === 'archived') {
      query.set('view', 'archived');
    }
    const qs = query.toString();
    return qs ? `/accounts?${qs}` : '/accounts';
  };

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', targetPage.toString());
    params.set('pageSize', String(pageSize));
    if (view === 'archived') params.set('view', 'archived');
    const qs = params.toString();
    return qs ? `/accounts?${qs}` : '/accounts';
  };

  const hasPrev = (meta?.page ?? 1) > 1;
  const hasNext = meta ? meta.page < meta.totalPages : false;
  const isLongList = (meta?.totalPages ?? 1) > 2;

  return (
    <div className="space-y-10" data-testid="accounts-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm font-medium">
          <Link
            href={buildViewHref('active')}
            className={`rounded-full px-4 py-1 ${view === 'active' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            {t('tabs.active')}
          </Link>
          <Link
            href={buildViewHref('archived')}
            className={`rounded-full px-4 py-1 ${view === 'archived' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}
          >
            {t('tabs.archived')}
          </Link>
        </div>
        <div className="flex items-center">
          <PageSizeSelector
            action="/accounts"
            pageSize={pageSize}
            hiddenFields={{ search, view }}
            label={locale === 'ja' ? '最大表示数' : 'Max rows'}
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <form className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]" action="/accounts" method="get">
              {view === 'archived' && <input type="hidden" name="view" value="archived" />}
              <input type="hidden" name="page" value="1" />
              <FloatingInput name="search" label={tCommon('search')} example={tForm('namePlaceholder')} defaultValue={search} />
              <div className="flex items-end justify-end">
                <Button type="submit" variant="primary" size="sm">
                  {tCommon('search')}
                </Button>
              </div>
            </form>
          </div>
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
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
              <tr className="app-table-head">
                <th className="px-4 py-2">{tTable('name')}</th>
                <th className="px-4 py-2">{tTable('industry')}</th>
                <th className="px-4 py-2">{tTable('revenue')}</th>
                  <th className="px-4 py-2">{tTable('status')}</th>
                  {view === 'archived' && <th className="px-4 py-2">{tTable('deletedAt')}</th>}
                  {view === 'archived' && <th className="px-4 py-2 text-right">{tTable('actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-t border-slate-100 text-slate-700 ">
                    <td className="px-4 py-3">
                      <Link href={`/accounts/${account.id}`} className="font-semibold app-link-accent" data-testid="account-link">
                        {account.name}
                      </Link>
                      <p className="text-xs app-table-muted">{account.domain ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 app-table-cell">{account.industry ?? '—'}</td>
                    <td className="px-4 py-3 font-mono app-table-cell">{formatCurrency(account.annualRevenue)}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const { label, tone } = getAccountStatusMeta(account.status, locale);
                        return <StatusBadge label={label} tone={tone} />;
                      })()}
                    </td>
                    {view === 'archived' && (
                      <td className="px-4 py-3 text-sm text-slate-500">{account.deletedAt ? new Date(account.deletedAt).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US') : '—'}</td>
                    )}
                    {view === 'archived' && (
                      <td className="px-4 py-3 text-right">
                        <RestoreAccountButton accountId={account.id} />
                      </td>
                    )}
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={view === 'archived' ? 6 : 4} className="px-4 py-6 text-center text-sm text-slate-500">
                      {view === 'archived' ? t('emptyArchived') : t('emptyActive')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
        {view === 'active' ? (
          <Card>
            <h2 className="text-lg font-semibold">{t('addTitle')}</h2>
            <p className="mb-4 text-sm text-slate-500">{t('addSubtitle')}</p>
            <AccountForm action={createAccountAction} submitLabel={tForm('submitCreate')} successRedirect="/accounts" formKey="create" />
          </Card>
        ) : (
          <Card>
            <h2 className="text-lg font-semibold">{t('tabs.archived')}</h2>
            <p className="text-sm text-slate-500">{t('archivedInfo')}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
// Turbopack dev で _jsxDEV 未定義になるケースへの安全策
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { jsxDEV as _jsxDEV } from 'react/jsx-dev-runtime';
