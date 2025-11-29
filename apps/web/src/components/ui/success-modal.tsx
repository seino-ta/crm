'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { useToastContext } from '@/components/providers/toast-provider';

type SuccessToastProps = {
  message: string;
  open?: boolean;
  trigger?: unknown;
  duration?: number;
};

export function SuccessToast({ open, trigger, message, duration = 2400 }: SuccessToastProps) {
  const toastCtx = useToastContext();
  const [visible, setVisible] = useState(false);
  const lastTriggerRef = useRef<unknown>();
  const lastOpenRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showInlineToast = useEffectEvent(() => {
    setVisible(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
    }, duration);
  });

  const showToast = useEffectEvent(() => {
    if (toastCtx) {
      toastCtx.showToast(message, { duration });
      return;
    }
    showInlineToast();
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (trigger === undefined || trigger === null || trigger === lastTriggerRef.current) {
      return;
    }
    lastTriggerRef.current = trigger;
    showToast();
  }, [trigger, showToast]);

  useEffect(() => {
    const nextOpen = Boolean(open);
    if (!nextOpen || lastOpenRef.current === nextOpen) {
      lastOpenRef.current = nextOpen;
      return;
    }
    lastOpenRef.current = nextOpen;
    showToast();
  }, [open, showToast]);

  if (toastCtx || !visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center">
      <div className="rounded-full bg-emerald-600/90 px-5 py-2 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}
