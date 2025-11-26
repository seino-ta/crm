'use client';

import { forwardRef } from 'react';
import clsx from 'clsx';

const baseClasses = 'app-input w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={clsx(baseClasses, className)} {...props}>
      {children}
    </select>
  )
);

Select.displayName = 'Select';
