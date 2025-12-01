import { notFound } from 'next/navigation';

import { AuditAction } from '@prisma/client';

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

  const { data } = await listAuditLogs({
    pageSize: 50,
    entityType: entityType || undefined,
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  return (
    <div className="space-y-8" data-testid="audit-logs-page">
      <div className="page-header">
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <Card>
        <form className="grid gap-4 md:grid-cols-4" action="/admin/audit-logs" method="get">
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
          <div className="md:col-span-4 flex justify-end">
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
      </Card>
    </div>
  );
}
