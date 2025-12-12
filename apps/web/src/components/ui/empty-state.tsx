import type { ReactNode } from 'react';
import clsx from 'clsx';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center', className)}>
      {icon ? <div className="mb-3 text-slate-400">{icon}</div> : null}
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
