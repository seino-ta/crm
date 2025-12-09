import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
import { PageSizeSelector, PaginationBar, PaginationBarLite } from '@/components/ui/pagination-controls';
import { listAccounts, listContacts } from '@/lib/data';
import { getServerTranslations } from '@/lib/i18n/server';
import { ContactForm } from './contact-form';
import { DeleteContactButton } from './delete-contact-button';
import { formatDate } from '@/lib/formatters';

function extractParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

const PAGE_SIZE = 20;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ContactsPage({ searchParams }: { searchParams: SearchParams }) {
  const { t, locale } = await getServerTranslations('contacts');
  const filters = await searchParams;
  const search = extractParam(filters, 'search');
  const accountId = extractParam(filters, 'accountId');
  const requestedPageSize = Number(extractParam(filters, 'pageSize') || PAGE_SIZE);
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : PAGE_SIZE;
  const requestedPage = Number(extractParam(filters, 'page') || '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

  const [{ data: contacts, meta }, accounts] = await Promise.all([
    listContacts({ search: search || undefined, accountId: accountId || undefined, page, pageSize }),
    listAccounts({ pageSize: 200 }),
  ]);

  const hasPrev = (meta?.page ?? 1) > 1;
  const hasNext = meta ? meta.page < meta.totalPages : false;
  const isLongList = (meta?.totalPages ?? 1) > 2;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (accountId) params.set('accountId', accountId);
    params.set('page', targetPage.toString());
    params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return qs ? `/contacts?${qs}` : '/contacts';
  };

  return (
    <div className="space-y-8" data-testid="contacts-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form className="grid flex-1 min-w-[280px] gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]" action="/contacts" method="get">
            <input type="hidden" name="page" value="1" />
            <FloatingInput name="search" label={t('filters.searchLabel')} example={t('filters.searchPlaceholder')} defaultValue={search} />
            <FloatingSelect name="accountId" label={t('filters.account')} defaultValue={accountId ?? ''} forceFloatLabel>
              <option value="">{t('filters.accountAll')}</option>
              {accounts.data.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </FloatingSelect>
            <div className="flex items-end">
              <Button type="submit" size="sm">
                {t('filters.submit')}
              </Button>
            </div>
          </form>
          <div className="flex items-center">
            <PageSizeSelector
              action="/contacts"
              pageSize={pageSize}
              hiddenFields={{ search, accountId }}
              label={locale === 'ja' ? '最大表示数' : 'Max rows'}
            />
          </div>
        </div>
        {isLongList && (
          <div className="mt-4">
            <PaginationBarLite
              page={meta?.page ?? 1}
              totalPages={meta?.totalPages ?? 1}
              prevHref={hasPrev ? buildPageHref((meta?.page ?? 1) - 1) : null}
              nextHref={hasNext ? buildPageHref((meta?.page ?? 1) + 1) : null}
              prevLabel={t('list.prev')}
              nextLabel={t('list.next')}
            />
          </div>
        )}
      </Card>
      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
        <Card>
          <h2 className="text-lg font-semibold">{t('list.title')}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="app-table-head">
                  <th className="px-3 py-2 text-left">{t('list.headers.name')}</th>
                  <th className="px-3 py-2 text-left">{t('list.headers.kana')}</th>
                  <th className="px-3 py-2 text-left">{t('list.headers.email')}</th>
                  <th className="px-3 py-2 text-left">{t('list.headers.phone')}</th>
                  <th className="px-3 py-2 text-left">{t('list.headers.account')}</th>
                  <th className="px-3 py-2 text-left">{t('list.headers.created')}</th>
                  <th className="px-3 py-2 text-left w-[140px]">{t('list.headers.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">
                      {t('list.empty')}
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="border-t border-slate-100" data-testid="contact-row">
                      <td className="px-3 py-2 font-medium">
                        <Link
                          href={`/contacts/${contact.id}/edit`}
                          className="text-blue-600 hover:underline"
                          data-testid="contact-edit-link"
                        >
                          {contact.lastName} {contact.firstName}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        {contact.kanaLastName || contact.kanaFirstName
                          ? `${contact.kanaLastName ?? ''} ${contact.kanaFirstName ?? ''}`.trim()
                          : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <a href={`mailto:${contact.email}`} className="text-blue-600 underline">
                          {contact.email}
                        </a>
                      </td>
                      <td className="px-3 py-2">{contact.phone ?? '—'}</td>
                      <td className="px-3 py-2">
                        {contact.account ? (
                          <Link href={`/accounts/${contact.account.id}`} className="text-blue-600">
                            {contact.account.name}
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2">{formatDate(contact.createdAt)}</td>
                      <td className="px-3 py-2 w-[140px]">
                        <div className="flex flex-wrap gap-2 text-sm">
                          <DeleteContactButton
                            contactId={contact.id}
                            accountId={contact.account?.id}
                            contactName={`${contact.lastName} ${contact.firstName}`}
                            testId="contact-delete-button"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
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
        <Card>
          <h2 className="text-lg font-semibold">{t('form.title')}</h2>
          <ContactForm accounts={accounts.data.map((account) => ({ id: account.id, name: account.name }))} />
        </Card>
      </div>
    </div>
  );
}
