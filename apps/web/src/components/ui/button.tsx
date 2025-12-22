'use client';

import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';
import clsx from 'clsx';

const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<'primary' | 'secondary' | 'ghost' | 'danger', string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600',
  secondary: 'bg-white text-slate-900 border border-slate-300 hover:border-slate-400 hover:bg-white focus-visible:outline-slate-400',
  ghost: 'bg-transparent text-slate-900 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:outline-rose-600',
};

const sizes: Record<'md' | 'sm', string> = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
};

export type ButtonVariant = keyof typeof variants;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  asChild?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={clsx(baseClasses, sizes[size], variants[variant], className)} {...props}>
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
