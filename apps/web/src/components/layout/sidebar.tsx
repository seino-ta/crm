'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import type { UserRole } from '@/lib/types';
import { useI18n } from '@/components/providers/i18n-provider';

const mainNavItems = [
  { href: '/dashboard', key: 'dashboard' },
  { href: '/accounts', key: 'accounts' },
  { href: '/contacts', key: 'contacts' },
  { href: '/opportunities', key: 'opportunities' },
  { href: '/activities', key: 'activities' },
  { href: '/tasks', key: 'tasks' },
  { href: '/reports', key: 'reports' },
];

const adminNavItems = [{ href: '/admin/audit-logs', key: 'auditLogs' }];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const { t } = useI18n('nav');
  const baseClasses = 'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500';
  const inactiveClasses = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col gap-6 border-r border-slate-200 bg-white p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">CRM</p>
        <p className="text-xl font-bold text-slate-900">Revenue Desk</p>
      </div>
      <nav className="flex-1">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(baseClasses, isActive ? 'bg-blue-600 text-white shadow' : inactiveClasses)}
                  data-testid={`nav-${item.key}`}
                >
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
        {role === 'ADMIN' && (
          <div className="mt-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('adminMenu')}</p>
            <ul className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(baseClasses, isActive ? 'bg-blue-600 text-white shadow' : inactiveClasses)}
                      data-testid={`nav-${item.key}`}
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>
      <div className="text-xs text-slate-500">© {new Date().getFullYear()} CRM Platform</div>
    </aside>
  );
}
