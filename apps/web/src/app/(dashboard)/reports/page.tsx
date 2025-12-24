import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getServerTranslations } from '@/lib/i18n/server';

const enableFullReports = process.env.NEXT_PUBLIC_ENABLE_FULL_REPORTS === 'true';

export default async function ReportsPageEntry() {
  if (enableFullReports) {
    const { default: FullReportsPage } = await import('./full-reports-page');
    return <FullReportsPage />;
  }

  const { t } = await getServerTranslations('reports');
  const title = t('disabled.title', { fallback: 'レポート機能を一時停止しています' });
  const description = t('disabled.description', {
    fallback:
      'Cloudflare Pages での安定稼働を優先するため、現在この環境では軽量モードで動作しています。',
  });

  return (
    <div className="space-y-6" data-testid="reports-disabled">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title', { fallback: 'Reports' })}</h1>
        <p className="text-muted-foreground">{t('subtitle', { fallback: 'Pipeline health overview' })}</p>
      </div>

      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Lite Mode</Badge>
          <p className="text-lg font-medium">{title}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="rounded-md bg-muted p-4 text-sm leading-relaxed">
          <p className="font-medium">フル版レポートを再有効化するには:</p>
          <ol className="list-decimal space-y-2 pl-5 pt-2">
            <li>
              環境変数 <code className="font-mono text-xs">NEXT_PUBLIC_ENABLE_FULL_REPORTS</code> を{' '}
              <code className="font-mono text-xs">true</code> に設定します。
            </li>
            <li>Next.js を再ビルドして再デプロイします（Cloudflare Pages では値が false のまま推奨）。</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
