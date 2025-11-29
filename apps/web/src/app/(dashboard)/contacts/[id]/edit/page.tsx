import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { ContactEditForm } from '../../contact-form';
import { getContact, listAccounts } from '@/lib/data';
import { getServerTranslations } from '@/lib/i18n/server';

export default async function ContactEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContact(id).catch(() => null);
  if (!contact) {
    notFound();
  }

  const { t } = await getServerTranslations('contacts');
  const accounts = await listAccounts({ pageSize: 200 });
  const contactName = `${contact.lastName} ${contact.firstName}`;

  return (
    <div className="space-y-6" data-testid="contact-edit-page">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{t('edit.sectionLabel')}</p>
          <h1 className="text-2xl font-semibold">{t('edit.title', { values: { name: contactName } })}</h1>
          <p className="text-sm text-slate-500">{t('edit.subtitle')}</p>
        </div>
        <Link href="/contacts" className="text-sm text-blue-600 hover:underline">
          {t('edit.backToList')}
        </Link>
      </div>
      <Card>
        <div className="p-4">
          <ContactEditForm contact={contact} accounts={accounts.data.map((account) => ({ id: account.id, name: account.name }))} />
        </div>
      </Card>
    </div>
  );
}
