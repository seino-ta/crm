import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

type DateRangeInputProps = {
  label: string;
  fromProps?: InputHTMLAttributes<HTMLInputElement>;
  toProps?: InputHTMLAttributes<HTMLInputElement>;
  required?: boolean;
  className?: string;
};

/**
 * from/to の2フィールドを横並びで持つ日付レンジ入力
 */
export function DateRangeInput({ label, fromProps, toProps, required, className }: DateRangeInputProps) {
  const fromId = fromProps?.id ?? fromProps?.name ?? 'date-from';
  const toId = toProps?.id ?? toProps?.name ?? 'date-to';
  return (
    <div className={clsx('flex flex-col gap-1 text-sm text-slate-700', className)}>
      <span className="font-medium">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <div className="grid grid-cols-2 gap-2">
        <input
          id={fromId}
          type="date"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          required={required}
          {...fromProps}
        />
        <input
          id={toId}
          type="date"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          required={required}
          {...toProps}
        />
      </div>
    </div>
  );
}
