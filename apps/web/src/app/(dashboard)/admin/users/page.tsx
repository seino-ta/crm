import { notFound } from 'next/navigation';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-field';
import { PageSizeSelector, PaginationBar, PaginationBarLite } from '@/components/ui/pagination-controls';
import { getCurrentUser } from '@/lib/auth';
import { listUsers } from '@/lib/data';
import { getServerTranslations } from '@/lib/i18n/server';
import type { UserRole } from '@/lib/types';
import { formatDateTime } from '@/lib/formatters';
import { InviteUserForm } from './invite-user-form';
import { StatusBadge } from '@/components/ui/status-badge';

function extractParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

const roleOptions: UserRole[] = ['ADMIN', 'MANAGER', 'REP'];

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (user.role !== 'ADMIN') {
    notFound();
  }
  const { t, locale } = await getServerTranslations('users');
  const filters = await searchParams;
  const search = extractParam(filters, 'search');
  const role = extractParam(filters, 'role');
  const status = extractParam(filters, 'status');
  const requestedPageSize = Number(extractParam(filters, 'pageSize') || '20');
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 20;
  const requestedPage = Number(extractParam(filters, 'page') || '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

  const { data: users, meta } = await listUsers({
    ...(search ? { search } : {}),
    ...(role ? { role: role as UserRole } : {}),
    ...(status ? { status: status as 'active' | 'inactive' } : {}),
    page,
    pageSize,
  });

  const hasPrev = (meta?.page ?? 1) > 1;
  const hasNext = meta ? meta.page < meta.totalPages : false;
  const isLongList = (meta?.totalPages ?? 1) > 2;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    params.set('page', targetPage.toString());
    params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : '/admin/users';
  };

  return (
    <div className="space-y-6" data-testid="admin-users-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <form
              className="grid gap-4 md:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))_auto]"
              action="/admin/users"
              method="get"
            >
              <input type="hidden" name="page" value="1" />
              <FloatingInput
                name="search"
                label={t('filters.searchLabel')}
                example={t('filters.searchPlaceholder')}
                defaultValue={search}
                containerClassName="md:col-span-1"
              />
              <FloatingSelect name="role" label={t('filters.role')} defaultValue={role ?? ''} forceFloatLabel>
                <option value="">{t('filters.roleAll')}</option>
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {t(`roles.${option.toLowerCase()}`)}
                  </option>
                ))}
              </FloatingSelect>
              <FloatingSelect name="status" label={t('filters.status')} defaultValue={status ?? ''} forceFloatLabel>
                <option value="">{t('filters.statusAll')}</option>
                <option value="active">{t('filters.statusActive')}</option>
                <option value="inactive">{t('filters.statusInactive')}</option>
              </FloatingSelect>
              <div className="flex flex-wrap items-end gap-2">
                <Button type="submit" size="sm">
                  {t('filters.submit')}
                </Button>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  {t('filters.clear')}
                </Link>
              </div>
            </form>
            <div className="flex items-center">
              <PageSizeSelector
                action="/admin/users"
                pageSize={pageSize}
                hiddenFields={{ search, role, status }}
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
        <Card>
          <h2 className="text-lg font-semibold">{t('invite.title')}</h2>
          <InviteUserForm />
        </Card>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="app-table-head">
                <th className="px-3 py-2 text-left w-[420px]">{t('list.headers.profile')}</th>
                <th className="px-3 py-2 text-left w-[200px]">{t('list.headers.role')}</th>
                <th className="px-3 py-2 text-left w-[140px]">{t('list.headers.status')}</th>
                <th className="px-3 py-2 text-left">{t('list.headers.lastLogin')}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">
                    {t('list.empty')}
                  </td>
                </tr>
              ) : (
                users.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100" data-testid="user-row">
                    <td className="px-3 py-2 align-top max-w-[420px]">
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">
                          <Link href={`/admin/users/${item.id}`} className="text-blue-600" data-testid="user-detail-link">
                            {`${item.lastName ?? ''} ${item.firstName ?? ''}`.trim() || item.email}
                          </Link>
                        </div>
                        {item.title && <p className="text-xs text-slate-500">{item.title}</p>}
                        <p className="text-xs text-slate-500 break-all">{item.email}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      {t(`roles.${item.role.toLowerCase()}`)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        label={item.isActive ? t('list.status.active') : t('list.status.inactive')}
                        tone={item.isActive ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {item.lastLoginAt ? formatDateTime(item.lastLoginAt) : t('list.noLogin')}
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
    </div>
  );
}
