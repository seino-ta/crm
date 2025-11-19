'use client';

import { forwardRef } from 'react';
import clsx from 'clsx';

const baseClasses = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={clsx(baseClasses, className)} {...props} />
);

Input.displayName = 'Input';
