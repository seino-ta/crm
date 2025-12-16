import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function LeadConvertPage() {
  const { t } = await getServerTranslations('leads');

  return (
    <div className="space-y-8" data-testid="lead-convert-page">
      <div className="page-header">
        <h1>{t('convert.title', { fallback: 'Convert Lead' })}</h1>
        <p className="text-slate-600">
          {t('convert.description', {
            fallback:
              'Select the destination Account / Contact / Opportunity for this lead. This is a placeholder for the upcoming convert flow.',
          })}
        </p>
      </div>
      <Card className="space-y-4 p-6">
        <p className="text-sm text-slate-600">
          {t('convert.todo', {
            fallback:
              'Here we will let you map a lead into Account / Contact / Opportunity, or create new ones in a single step. For now this page is a stub so designers and developers can align on the UX.',
          })}
        </p>
        <div className="flex gap-3">
          <Button asChild variant="primary">
            <Link href="/leads">{t('convert.back', { fallback: 'Back to Leads' })}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/opportunities">{t('convert.toDeals', { fallback: 'Go to Opportunities' })}</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
