import type { ReactNode } from 'react';

export function SuccessModal({ open, message }: { open: boolean; message: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30">
      <div className="rounded-2xl bg-white px-6 py-4 text-slate-900 shadow-2xl">
        <p>{message}</p>
      </div>
    </div>
  );
}
