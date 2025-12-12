import type { ReactNode } from 'react';
import clsx from 'clsx';

type ListToolbarProps = {
  summary?: string;
  right?: ReactNode;
  className?: string;
};

export function ListToolbar({ summary, right, className }: ListToolbarProps) {
  return (
    <div className={clsx('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="text-xs text-slate-500">{summary ?? ''}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
