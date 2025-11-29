import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div {...props} className={clsx('rounded-2xl border border-slate-200 bg-white p-6 shadow-sm', className)}>
      {children}
    </div>
  );
}
