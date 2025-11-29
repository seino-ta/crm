'use client';

import type { FormHTMLAttributes } from 'react';

export function ConfirmForm({ confirmMessage, children, onSubmit, ...props }: FormHTMLAttributes<HTMLFormElement> & { confirmMessage: string }) {
  return (
    <form
      {...props}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onSubmit?.(event);
      }}
    >
      {children}
    </form>
  );
}
