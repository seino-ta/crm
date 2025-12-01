'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ToastMessage = {
  id: number;
  text: string;
  duration: number;
  expiresAt: number;
};

type ToastContextValue = {
  showToast: (text: string, options?: { duration?: number }) => void;
};

const DEFAULT_DURATION = 2400;

const ToastContext = createContext<ToastContextValue | null>(null);

function persistToast(message: ToastMessage) {
  if (typeof window === 'undefined') return;
  window.__CRM_TOAST__ = { id: message.id, text: message.text, expiresAt: message.expiresAt };
}

function clearPersistedToast(id?: number) {
  if (typeof window === 'undefined') return;
  if (window.__CRM_TOAST__ && (!id || window.__CRM_TOAST__.id === id)) {
    delete window.__CRM_TOAST__;
  }
}

function readPersistedToast(): ToastMessage | null {
  if (typeof window === 'undefined') return null;
  const persisted = window.__CRM_TOAST__;
  if (!persisted) return null;
  const remaining = persisted.expiresAt - Date.now();
  if (remaining <= 0) {
    clearPersistedToast(persisted.id);
    return null;
  }
  return {
    id: persisted.id,
    text: persisted.text,
    duration: remaining,
    expiresAt: persisted.expiresAt,
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, options?: { duration?: number }) => {
    const duration = options?.duration ?? DEFAULT_DURATION;
    const now = Date.now();
    const message: ToastMessage = {
      id: now,
      text,
      duration,
      expiresAt: now + duration,
    };
    persistToast(message);
    setToast(message);
  }, []);

  useEffect(() => {
    const restored = readPersistedToast();
    if (!restored) return undefined;
    const timeoutId = window.setTimeout(() => setToast(restored), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!toast) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const remaining = Math.max(0, toast.expiresAt - Date.now());
    if (remaining === 0) {
      const timeoutId = window.setTimeout(() => setToast(null), 0);
      clearPersistedToast(toast.id);
      return () => window.clearTimeout(timeoutId);
    }
    timerRef.current = setTimeout(() => {
      setToast(null);
      clearPersistedToast(toast.id);
      timerRef.current = null;
    }, remaining);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [toast]);

  const contextValue = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastViewport toast={toast} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center">
      <div
        key={toast.id}
        className="rounded-full bg-emerald-600/90 px-5 py-2 text-sm font-medium text-white shadow-lg transition-opacity"
        data-testid="global-toast"
      >
        {toast.text}
      </div>
    </div>
  );
}

export function useToastContext() {
  return useContext(ToastContext);
}

declare global {
  interface Window {
    __CRM_TOAST__?: {
      id: number;
      text: string;
      expiresAt: number;
    };
  }
}
