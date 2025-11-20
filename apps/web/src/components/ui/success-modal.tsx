'use client';

type SuccessToastProps = {
  message: string;
  open: boolean;
};

export function SuccessToast({ open, message }: SuccessToastProps) {
  if (!open) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center">
      <div className="rounded-full bg-emerald-600/90 px-5 py-2 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}
