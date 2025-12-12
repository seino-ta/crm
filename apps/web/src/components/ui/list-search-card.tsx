import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from './card';
import { Button } from './button';

type HiddenFields = Record<string, string | undefined>;

type ListSearchCardProps = {
  action: string;
  method?: 'get' | 'post';
  hiddenFields?: HiddenFields;
  submitLabel: string;
  clearLabel: string;
  clearHref: string;
  children: ReactNode;
  className?: string;
};

/**
 * 一覧用の検索カード: hidden page=1 を自動付与し、検索/クリアボタンを配置
 */
export function ListSearchCard({
  action,
  method = 'get',
  hiddenFields,
  submitLabel,
  clearLabel,
  clearHref,
  children,
  className,
}: ListSearchCardProps) {
  return (
    <Card className={className}>
      <form className="grid gap-4 md:grid-cols-[minmax(0,2fr)_auto]" action={action} method={method}>
        <input type="hidden" name="page" value="1" />
        {hiddenFields &&
          Object.entries(hiddenFields)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}
        {children}
        <div className="flex items-end justify-end gap-2">
          <Button type="submit" size="sm">
            {submitLabel}
          </Button>
          <Link
            href={clearHref}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 transition hover:border-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            {clearLabel}
          </Link>
        </div>
      </form>
    </Card>
  );
}
