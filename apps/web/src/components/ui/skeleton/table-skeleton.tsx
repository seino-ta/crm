import clsx from 'clsx';

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div className={clsx('overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm', className)}>
      <div className="h-10 bg-slate-50" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid items-center gap-2 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((__, c) => (
              <div key={c} className="h-3 w-full animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
