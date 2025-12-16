'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';

type CreateDrawerProps = {
  title: string;
  description?: string;
  triggerLabel?: string;
  triggerTestId?: string;
  children: ReactNode;
};

/**
 * シンプルな作成用ドロワー
 * - トリガーボタン + 右側スライドパネル
 * - フォーカスは最低限（Esc で閉じる）
 */
export function CreateDrawer({ title, description, triggerLabel = 'Create', triggerTestId, children }: CreateDrawerProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('keydown', handler);
    }
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open && panelRef.current) {
      const focusable = panelRef.current.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      focusable?.focus();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        data-testid={triggerTestId}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <span aria-hidden>＋</span>
        {triggerLabel}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setOpen(false)} aria-hidden />
          <div
            ref={panelRef}
            className={clsx(
              'relative z-10 ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl ring-1 ring-slate-200',
              'animate-[slideIn_0.18s_ease-out]'
            )}
            aria-modal="true"
            role="dialog"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                {description ? <p className="text-sm text-slate-500">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                aria-label="Close"
              >
                <span className="block h-5 w-5 text-center leading-5" aria-hidden>
                  ×
                </span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
