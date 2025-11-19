import clsx from 'clsx';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'neutral';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
  neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
};

export function Badge({ variant = 'default', className, children }: { variant?: BadgeVariant; className?: string; children: React.ReactNode }) {
  return <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>{children}</span>;
}
