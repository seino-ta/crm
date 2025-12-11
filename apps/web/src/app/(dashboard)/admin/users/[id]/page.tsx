import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { getCurrentUser } from '@/lib/auth';
import { getServerTranslations } from '@/lib/i18n/server';
import { formatDateTime } from '@/lib/formatters';
import { getUser } from '@/lib/data';
import { UserProfileForm } from './user-profile-form';
import { UserRoleForm } from './user-role-form';
import { UserStatusForm } from './user-status-form';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (current.role !== 'ADMIN') {
    notFound();
  }
  const { t } = await getServerTranslations('users');
  const user = await getUser(id).catch(() => null);
  if (!user) {
    notFound();
  }

  const name = `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim() || '—';

  return (
    <div className="space-y-6" data-testid="admin-user-detail-page">
      <div className="page-header">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('detail.title')}</p>
          <h1 className="text-3xl font-bold">{name}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <Link href="/admin/users" className="text-sm text-blue-600">
          {t('detail.back')}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">{t('detail.profileSection')}</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-500">{t('detail.fields.email')}</dt>
              <dd className="break-all">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">{t('detail.fields.role')}</dt>
              <dd>{t(`roles.${user.role.toLowerCase()}`)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">{t('list.headers.status')}</dt>
              <dd>
                <StatusBadge label={user.isActive ? t('list.status.active') : t('list.status.inactive')} tone={user.isActive ? 'success' : 'neutral'} />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">{t('list.headers.lastLogin')}</dt>
              <dd>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : t('list.noLogin')}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">{t('detail.profileEditSection')}</h2>
          <div className="mt-4">
            <UserProfileForm
              userId={user.id}
              firstName={user.firstName}
              lastName={user.lastName}
              title={user.title ?? null}
              phone={user.phone ?? null}
              revalidatePath={`/admin/users/${user.id}`}
            />
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">{t('detail.accessSection')}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr,auto]">
            <UserRoleForm userId={user.id} currentRole={user.role} revalidatePath={`/admin/users/${user.id}`} />
            <UserStatusForm
              userId={user.id}
              isActive={user.isActive ?? false}
              revalidatePath={`/admin/users/${user.id}`}
            />
          </div>
      </Card>
    </div>
  );
}
