import { notFound } from 'next/navigation';

import { AuditAction } from '@prisma/client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { listAuditLogs } from '@/lib/data';
import { getCurrentUser } from '@/lib/auth';
import { formatDateTime } from '@/lib/formatters';

const auditActionOptions = Object.values(AuditAction);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function extractParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function AuditLogsPage({ searchParams }: { searchParams: SearchParams }) {
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
        <h1>監査ログ</h1>
        <p>主要エンティティの作成・更新・削除履歴を時系列で確認できます。</p>
      </div>
      <Card>
        <form className="grid gap-4 md:grid-cols-4" action="/admin/audit-logs" method="get">
          <Input name="entityType" placeholder="エンティティ" defaultValue={entityType} />
          <Select name="action" defaultValue={action}>
            <option value="">すべてのアクション</option>
            {auditActionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Input type="date" name="from" defaultValue={from} aria-label="開始日" />
          <Input type="date" name="to" defaultValue={to} aria-label="終了日" />
          <div className="md:col-span-4 flex justify-end">
            <Button type="submit" size="sm">
              絞り込む
            </Button>
          </div>
        </form>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-3 py-2 text-left">日時</th>
                <th className="px-3 py-2 text-left">アクション</th>
                <th className="px-3 py-2 text-left">対象</th>
                <th className="px-3 py-2 text-left">ユーザー</th>
                <th className="px-3 py-2 text-left">詳細</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                    条件に一致する監査ログはありません。
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
