'use client';

import Link from 'next/link';

type HiddenFields = Record<string, string | undefined>;

export function PageSizeSelector({
  action,
  pageSize,
  hiddenFields,
  options = [10, 20, 50, 100],
  id,
  label,
}: {
  action: string;
  pageSize: number;
  hiddenFields?: HiddenFields;
  options?: number[];
  id?: string;
  label: string;
}) {
  const formId = id ? `${id}-form` : 'page-size-form';

  return (
    <form id={formId} action={action} method="get" className="inline-flex items-center gap-2">
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
        onChange={(e) => {
          const form = e.currentTarget.form;
          if (form) form.submit();
        }}
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size} / page
          </option>
        ))}
      </select>
    </form>
  );
}

export function PaginationBar({
  page,
  totalPages,
  prevHref,
  nextHref,
  pageLabel = 'Page',
  prevLabel = 'Prev',
  nextLabel = 'Next',
}: {
  page: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
  pageLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
}) {
  if (totalPages <= 1) return null;
  const hasPrev = !!prevHref;
  const hasNext = !!nextHref;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <span>
        {pageLabel} {page} / {totalPages}
      </span>
      <div className="space-x-2">
        {hasPrev ? (
          <Link
            href={prevHref as string}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            {prevLabel}
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400">
            {prevLabel}
          </span>
        )}
        {hasNext ? (
          <Link
            href={nextHref as string}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            {nextLabel}
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400">
            {nextLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function PaginationBarLite({
  page: _page,
  totalPages,
  prevHref,
  nextHref,
  prevLabel = 'Prev',
  nextLabel = 'Next',
}: {
  page: number;
  totalPages: number;
  prevHref: string | null;
  nextHref: string | null;
  prevLabel?: string;
  nextLabel?: string;
}) {
  if (totalPages <= 1) return null;
  void _page; // reserved for future use
  const hasPrev = !!prevHref;
  const hasNext = !!nextHref;
  return (
    <div className="flex items-center justify-end gap-2 text-xs text-slate-600">
      {hasPrev ? (
        <Link
          href={prevHref as string}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          {prevLabel}
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400">
          {prevLabel}
        </span>
      )}
      {hasNext ? (
        <Link
          href={nextHref as string}
          className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          {nextLabel}
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-400">
          {nextLabel}
        </span>
      )}
    </div>
  );
}
