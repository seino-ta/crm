'use client';

import { useCallback, useEffect, useState } from 'react';

import { useToastContext } from '@/components/providers/toast-provider';

export function useSuccessToast(duration = 2400) {
  const toastCtx = useToastContext();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastCtx || !message) return;
    toastCtx.showToast(message, { duration });
    const timeoutId = window.setTimeout(() => setMessage(null), 0);
    return () => window.clearTimeout(timeoutId);
  }, [message, toastCtx, duration]);

  useEffect(() => {
    if (!toastCtx) return undefined;
    const timeoutId = window.setTimeout(() => setMessage(null), 0);
    return () => window.clearTimeout(timeoutId);
  }, [toastCtx]);

  const showToast = useCallback(
    (nextMessage: string) => {
      if (toastCtx) {
        toastCtx.showToast(nextMessage, { duration });
      } else {
        setMessage(nextMessage);
      }
    },
    [toastCtx, duration]
  );

  return {
    open: toastCtx ? false : Boolean(message),
    message: toastCtx ? null : message,
    showToast,
    hide: () => (toastCtx ? undefined : setMessage(null)),
  } as const;
}
