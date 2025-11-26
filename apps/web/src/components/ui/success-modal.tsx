'use client';

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';

import { useToastContext } from '@/components/providers/toast-provider';

type SuccessToastProps = {
  message: string;
  open?: boolean;
  trigger?: unknown;
  duration?: number;
};

type ToastContextValue = NonNullable<ReturnType<typeof useToastContext>>;

type ResolvedToastProps = {
  message: string;
  open?: boolean;
  trigger?: unknown;
  duration: number;
};

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function SuccessToast({ open, trigger, message, duration = 2400 }: SuccessToastProps) {
  const toastCtx = useToastContext();
  if (toastCtx) {
    return <GlobalSuccessToast toastCtx={toastCtx} open={open} trigger={trigger} message={message} duration={duration} />;
  }
  return <InlineSuccessToast open={open} trigger={trigger} message={message} duration={duration} />;
}

type GlobalSuccessToastProps = ResolvedToastProps & {
  toastCtx: ToastContextValue;
};

function GlobalSuccessToast({ toastCtx, open, trigger, message, duration }: GlobalSuccessToastProps) {
  const lastTriggerRef = useRef<unknown>();
  const lastOpenRef = useRef<boolean>(false);

  useIsomorphicLayoutEffect(() => {
    if (trigger === undefined || trigger === null) return;
    if (lastTriggerRef.current === trigger) return;
    lastTriggerRef.current = trigger;
    toastCtx.showToast(message, { duration });
  }, [trigger, toastCtx, message, duration]);

  useIsomorphicLayoutEffect(() => {
    const nextOpen = Boolean(open);
    if (!nextOpen) {
      lastOpenRef.current = nextOpen;
      return;
    }
    if (lastOpenRef.current === nextOpen) return;
    lastOpenRef.current = nextOpen;
    toastCtx.showToast(message, { duration });
  }, [open, toastCtx, message, duration]);

  return null;
}

function InlineSuccessToast({ open, trigger, message, duration }: ResolvedToastProps) {
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
    showInlineToast();
  }, [trigger]);

  useEffect(() => {
    const nextOpen = Boolean(open);
    if (!nextOpen || lastOpenRef.current === nextOpen) {
      lastOpenRef.current = nextOpen;
      return;
    }
    lastOpenRef.current = nextOpen;
    showInlineToast();
  }, [open]);

  if (!visible) {
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
