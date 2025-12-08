import Link from 'next/link';

type HiddenFields = Record<string, string | undefined>;

export function PageSizeSelector({
  action,
  pageSize,
  hiddenFields,
  options = [10, 20, 50, 100],
  id,
  label = 'Page size',
}: {
  action: string;
  pageSize: number;
  hiddenFields?: HiddenFields;
  options?: number[];
  id?: string;
  label?: string;
}) {
  return (
    <form action={action} method="get" className="inline-flex items-center gap-2">
      <input type="hidden" name="page" value="1" />
      {hiddenFields &&
        Object.entries(hiddenFields)
          .filter(([, value]) => value !== undefined && value !== '')
          .map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
      <label className="text-xs text-slate-500" htmlFor={id ?? 'page-size'}>
        {label}
      </label>
      <select
        id={id ?? 'page-size'}
        name="pageSize"
        defaultValue={String(pageSize)}
        className="rounded-md border border-slate-200 px-2 py-1 text-xs"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size} / page
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
      >
        Apply
      </button>
    </form>
  );
}

export function PaginationBar({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (target: number) => string;
}) {
  if (totalPages <= 1) return null;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <span>
        Page {page} / {totalPages}
      </span>
      <div className="space-x-2">
        {hasPrev ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            Prev
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400">
            Prev
          </span>
        )}
        {hasNext ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            Next
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400">
            Next
          </span>
        )}
      </div>
    </div>
  );
}

export function PaginationBarLite({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (target: number) => string;
}) {
  if (totalPages <= 1) return null;
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  return (
    <div className="flex items-center justify-end gap-2 text-xs text-slate-600">
      {hasPrev ? (
        <Link
          href={buildHref(page - 1)}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          Prev
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400">
          Prev
        </span>
      )}
      {hasNext ? (
        <Link
          href={buildHref(page + 1)}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          Next
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400">
          Next
        </span>
      )}
    </div>
  );
}
