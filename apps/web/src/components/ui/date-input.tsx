import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

type DateInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
  id?: string;
  required?: boolean;
};

/**
 * シンプルな日付入力（FloatingInput 互換のラベル付き）
 */
export function DateInput({ label, description, className, id, required, ...props }: DateInputProps) {
  const inputId = id ?? props.name ?? 'date-input';
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-700" htmlFor={inputId}>
      <span className="font-medium">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <input
        id={inputId}
        type="date"
        className={clsx(
          'rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200',
          className
        )}
        required={required}
        {...props}
      />
      {description ? <span className="text-xs text-slate-500">{description}</span> : null}
    </label>
  );
}
