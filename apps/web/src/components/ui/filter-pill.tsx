import type { ReactNode } from 'react';
import clsx from 'clsx';

type FilterPillProps = {
  label: string;
  onClear?: () => void;
  clearLabel?: string;
  icon?: ReactNode;
  className?: string;
};

export function FilterPill({ label, onClear, clearLabel = 'Clear', icon, className }: FilterPillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700',
        className
      )}
    >
      {icon}
      <span>{label}</span>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
        >
          {clearLabel}
        </button>
      ) : null}
    </span>
  );
}
