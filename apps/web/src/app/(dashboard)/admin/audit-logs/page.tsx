import { notFound } from 'next/navigation';

import { AuditAction } from '@prisma/client';

import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-field';
import { Button } from '@/components/ui/button';
import { listAuditLogs } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { formatDateTime } from '@/lib/formatters';
import { getServerTranslations } from '@/lib/i18n/server';

const auditActionOptions = Object.values(AuditAction);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function extractParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function AuditLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const { t } = await getServerTranslations('auditLogs');
  const user = await getCurrentUser();
  if (user.role !== 'ADMIN') {
    notFound();
  }

  const filters = await searchParams;
  const entityType = extractParam(filters, 'entityType');
  const action = extractParam(filters, 'action');
  const from = extractParam(filters, 'from');
  const to = extractParam(filters, 'to');
  const requestedPageSize = Number(extractParam(filters, 'pageSize') || '20');
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 20;
  const requestedPage = Number(extractParam(filters, 'page') || '1');
  const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;

  const { data, meta } = await listAuditLogs({
    pageSize,
    page,
    entityType: entityType || undefined,
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const hasPrev = (meta?.page ?? 1) > 1;
  const hasNext = meta ? meta.page < meta.totalPages : false;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (entityType) params.set('entityType', entityType);
    if (action) params.set('action', action);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('page', targetPage.toString());
    params.set('pageSize', String(pageSize));
    const qs = params.toString();
    return qs ? `/admin/audit-logs?${qs}` : '/admin/audit-logs';
  };

  return (
    <div className="space-y-8" data-testid="audit-logs-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <Card>
        <form className="grid gap-4 md:grid-cols-5" action="/admin/audit-logs" method="get">
          <FloatingInput name="entityType" label={t('filters.entityLabel')} example={t('filters.entityPlaceholder')} defaultValue={entityType} />
          <FloatingSelect name="action" label={t('filters.actionLabel')} defaultValue={action ?? ''} forceFloatLabel>
            <option value="">{t('filters.actionAll')}</option>
            {auditActionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </FloatingSelect>
          <FloatingInput type="date" name="from" label={t('filters.from')} defaultValue={from} />
          <FloatingInput type="date" name="to" label={t('filters.to')} defaultValue={to} />
          <FloatingSelect name="pageSize" label="Page size" defaultValue={String(pageSize)} forceFloatLabel>
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </FloatingSelect>
          <div className="md:col-span-5 flex justify-end">
            <Button type="submit" size="sm">
              {t('filters.submit')}
            </Button>
          </div>
        </form>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="app-table-head">
                <th className="px-3 py-2 text-left">{t('table.datetime')}</th>
                <th className="px-3 py-2 text-left">{t('table.action')}</th>
                <th className="px-3 py-2 text-left">{t('table.entity')}</th>
                <th className="px-3 py-2 text-left">{t('table.user')}</th>
                <th className="px-3 py-2 text-left">{t('table.details')}</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                    {t('table.empty')}
                  </td>
                </tr>
              ) : (
                data.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 align-top">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="px-3 py-2">{log.action}</td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium">{log.entityType}</div>
                      <div className="text-xs text-slate-400 break-all">{log.entityId}</div>
                    </td>
                    <td className="px-3 py-2">
                      {log.user ? `${log.user.firstName ?? ''} ${log.user.lastName ?? ''}`.trim() || log.user.email : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {log.changes ? (
                        <pre className="whitespace-pre-wrap break-words">{JSON.stringify(log.changes, null, 2)}</pre>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>
              Page {meta.page} / {meta.totalPages}
            </span>
            <div className="space-x-2">
              <Button type="button" size="sm" variant="outline" disabled={!hasPrev} asChild>
                <Link href={hasPrev ? buildPageHref(meta.page - 1) : buildPageHref(meta.page)}>Prev</Link>
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={!hasNext} asChild>
                <Link href={hasNext ? buildPageHref(meta.page + 1) : buildPageHref(meta.page)}>Next</Link>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
