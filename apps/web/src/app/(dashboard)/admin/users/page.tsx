import { notFound } from 'next/navigation';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { listUsers } from '@/lib/data';
import { getServerTranslations } from '@/lib/i18n/server';
import type { UserRole } from '@/lib/types';
import { formatDateTime } from '@/lib/formatters';
import { InviteUserForm } from './invite-user-form';
import { updateUserAction, toggleUserStatusAction } from '@/lib/actions/users';

const PAGE_SIZE = 20;

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
  const { t } = await getServerTranslations('users');
  const filters = await searchParams;
  const search = extractParam(filters, 'search');
  const role = extractParam(filters, 'role');
  const status = extractParam(filters, 'status');
  const requestedPage = Number(extractParam(filters, 'page') || '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

  const { data: users, meta } = await listUsers({
    search: search || undefined,
    role: (role as UserRole) || undefined,
    status: status || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const hasPrev = (meta?.page ?? 1) > 1;
  const hasNext = meta ? meta.page < meta.totalPages : false;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    params.set('page', targetPage.toString());
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
          <form className="grid gap-4 md:grid-cols-4" action="/admin/users" method="get">
            <Input name="search" placeholder={t('filters.searchPlaceholder')} defaultValue={search} aria-label={t('filters.searchPlaceholder')} />
            <Select name="role" defaultValue={role} aria-label={t('filters.role')}>
              <option value="">{t('filters.roleAll')}</option>
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {t(`roles.${option.toLowerCase()}`)}
                </option>
              ))}
            </Select>
            <Select name="status" defaultValue={status} aria-label={t('filters.status')}>
              <option value="">{t('filters.statusAll')}</option>
              <option value="active">{t('filters.statusActive')}</option>
              <option value="inactive">{t('filters.statusInactive')}</option>
            </Select>
            <Button type="submit" size="sm">
              {t('filters.submit')}
            </Button>
          </form>
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
                <th className="px-3 py-2 text-left">{t('list.headers.name')}</th>
                <th className="px-3 py-2 text-left">{t('list.headers.email')}</th>
                <th className="px-3 py-2 text-left">{t('list.headers.role')}</th>
                <th className="px-3 py-2 text-left">{t('list.headers.status')}</th>
                <th className="px-3 py-2 text-left">{t('list.headers.lastLogin')}</th>
                <th className="px-3 py-2 text-left">{t('list.headers.actions')}</th>
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
                    <td className="px-3 py-2">
                      <div className="font-medium">{`${item.lastName ?? ''} ${item.firstName ?? ''}`.trim() || '—'}</div>
                      <div className="text-xs text-slate-500">{item.title ?? '—'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`mailto:${item.email}`} className="text-blue-600">
                        {item.email}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <form className="flex items-center gap-2" action={updateUserAction.bind(null, item.id)}>
                        <Select name="role" defaultValue={item.role} aria-label={t('list.headers.role')}>
                          {roleOptions.map((option) => (
                            <option key={option} value={option}>
                              {t(`roles.${option.toLowerCase()}`)}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit" size="sm" variant="secondary">
                          {t('list.actions.saveRole')}
                        </Button>
                      </form>
                    </td>
                    <td className="px-3 py-2">
                      <span className={item.isActive ? 'text-emerald-600' : 'text-slate-500'}>{item.isActive ? t('list.status.active') : t('list.status.inactive')}</span>
                    </td>
                    <td className="px-3 py-2">
                      {item.lastLoginAt ? formatDateTime(item.lastLoginAt) : t('list.noLogin')}
                    </td>
                    <td className="px-3 py-2">
                      <form action={toggleUserStatusAction.bind(null, item.id, !item.isActive)}>
                        <Button type="submit" size="sm" variant="ghost" className={item.isActive ? 'text-rose-600' : 'text-emerald-600'} data-testid="user-status-toggle">
                          {item.isActive ? t('list.actions.deactivate') : t('list.actions.activate')}
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>
              {t('list.pagination', {
                values: {
                  page: meta.page.toString(),
                  totalPages: meta.totalPages.toString(),
                },
              })}
            </span>
            <div className="space-x-2">
              <Button type="button" size="sm" variant="outline" disabled={!hasPrev} asChild>
                <Link href={hasPrev ? buildPageHref(meta.page - 1) : buildPageHref(meta.page)}>{t('list.prev')}</Link>
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={!hasNext} asChild>
                <Link href={hasNext ? buildPageHref(meta.page + 1) : buildPageHref(meta.page)}>{t('list.next')}</Link>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
