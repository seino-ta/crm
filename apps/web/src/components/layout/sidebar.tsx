'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/accounts', label: 'アカウント' },
  { href: '/opportunities', label: '案件' },
  { href: '/activities', label: '活動ログ' },
  { href: '/tasks', label: 'タスク' },
  { href: '/reports', label: 'レポート' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col gap-6 border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">CRM</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">Revenue Desk</p>
      </div>
      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900'
                  )}
                  data-testid={`nav-${item.label}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="text-xs text-slate-500">© {new Date().getFullYear()} CRM Platform</div>
    </aside>
  );
}
