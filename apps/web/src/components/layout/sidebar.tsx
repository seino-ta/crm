'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useState } from 'react';

import type { UserRole } from '@/lib/types';
import { useI18n } from '@/components/providers/i18n-provider';
import { Button } from '@/components/ui/button';

const mainNavItems = [
  { href: '/dashboard', key: 'dashboard' },
  { href: '/accounts', key: 'accounts' },
  { href: '/contacts', key: 'contacts' },
  { href: '/leads', key: 'leads' },
  { href: '/opportunities', key: 'opportunities' },
  { href: '/activities', key: 'activities' },
  { href: '/tasks', key: 'tasks' },
  { href: '/reports', key: 'reports' },
];

const adminNavItems = [
  { href: '/admin/users', key: 'users' },
  { href: '/admin/audit-logs', key: 'auditLogs' },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const { t } = useI18n('nav');
  const [collapsed, setCollapsed] = useState(false);
  const baseClasses = 'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500';
  const inactiveClasses = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  const shellClasses = clsx(
    'sticky top-0 flex h-screen flex-col border-r border-slate-200 bg-white transition-all',
    collapsed ? 'w-0 p-0 gap-0 border-transparent overflow-hidden' : 'w-64 p-6 gap-6'
  );

  const toggleButton = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
      onClick={() => setCollapsed((v) => !v)}
      className="fixed left-3 top-3 z-40"
    >
      {collapsed ? '☰' : '⟨'}
    </Button>
  );

  return (
    <>
      {toggleButton}
      <aside className={shellClasses} aria-hidden={collapsed}>
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">CRM</p>
              <p className="text-xl font-bold text-slate-900">Revenue Desk</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-1">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const label = t(item.key);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(baseClasses, isActive ? 'bg-blue-600 text-white shadow' : inactiveClasses)}
                      data-testid={`nav-${item.key}`}
                    >
                      {label}
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
        )}

        {!collapsed && <div className="text-xs text-slate-500">© {new Date().getFullYear()} CRM Platform</div>}
      </aside>
    </>
  );
}
