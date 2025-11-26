'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';

import { useToastContext } from '@/components/providers/toast-provider';

type StoredPayload = {
  snapshot: string;
  timestamp: number;
  match: boolean;
};

const DEFAULT_TTL_MS = 15000;
const STORAGE_PREFIX = 'crm:form-toast:';

type UseFormSuccessToastOptions = {
  formId: string;
  initialSnapshot: string;
  ttlMs?: number;
  matchInitialSnapshot?: boolean;
  message: string;
  duration?: number;
};

export function useFormSuccessToast({ formId, initialSnapshot, ttlMs = DEFAULT_TTL_MS, matchInitialSnapshot = true, message, duration = DEFAULT_TTL_MS }: UseFormSuccessToastOptions) {
  const storageKey = `${STORAGE_PREFIX}${formId}`;
  const [toastTrigger, setToastTrigger] = useState<symbol | null>(null);
  const lastSubmittedSnapshotRef = useRef<string>('');
  const toastCtx = useToastContext();
  const triggerImmediateToast = useCallback(() => {
    setToastTrigger(Symbol('form-saved'));
    if (toastCtx) {
      toastCtx.showToast(message, { duration });
    }
  }, [toastCtx, message, duration]);
  const emitStoredToast = useEffectEvent(() => {
    triggerImmediateToast();
  });

  const handleSubmitSnapshot = useCallback((snapshot: string) => {
    lastSubmittedSnapshotRef.current = snapshot;
  }, []);

  const handleSuccessPersist = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload: StoredPayload = {
        snapshot: lastSubmittedSnapshotRef.current,
        timestamp: Date.now(),
        match: matchInitialSnapshot,
      };
      window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ストレージが利用できない場合は無視
    }
  }, [matchInitialSnapshot, storageKey]);

  const handleErrorCleanup = useCallback(() => {
    lastSubmittedSnapshotRef.current = '';
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) return;
      const payload = JSON.parse(raw) as StoredPayload | null;
      if (!payload || typeof payload.timestamp !== 'number') {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      if (Date.now() - payload.timestamp > ttlMs) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }
      if (payload.match && payload.snapshot !== initialSnapshot) {
        return;
      }
      window.sessionStorage.removeItem(storageKey);
      emitStoredToast();
    } catch {
      // パース失敗時は無視
    }
  }, [initialSnapshot, storageKey, ttlMs]);

  return {
    toastTrigger,
    handleSubmitSnapshot,
    handleSuccessPersist,
    handleErrorCleanup,
    triggerImmediateToast,
  } as const;
}
