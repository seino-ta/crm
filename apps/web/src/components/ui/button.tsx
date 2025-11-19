'use client';

import { forwardRef } from 'react';
import clsx from 'clsx';

const baseClasses = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<'primary' | 'secondary' | 'ghost', string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-400 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700',
  ghost: 'bg-transparent text-slate-900 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800',
};

export type ButtonVariant = keyof typeof variants;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className, children, ...props }, ref) => (
    <button ref={ref} className={clsx(baseClasses, variants[variant], className)} {...props}>
      {children}
    </button>
  )
);

Button.displayName = 'Button';
