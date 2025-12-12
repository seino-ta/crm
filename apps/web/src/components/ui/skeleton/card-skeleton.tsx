import clsx from 'clsx';

export function CardSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('rounded-2xl border border-slate-100 bg-white p-4 shadow-sm', className)}>
      <div className="mb-3 h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <div key={idx} className="h-3 w-full animate-pulse rounded bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
