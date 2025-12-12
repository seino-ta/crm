import type { ReactNode } from 'react';
import clsx from 'clsx';

type ListPageLayoutProps = {
  title: string;
  description?: string;
  searchSection?: ReactNode;
  children: ReactNode;
  className?: string;
  'data-testid'?: string;
};

/**
 * 一覧ページの共通レイアウト（リード画面準拠）
 * - ページヘッダ
 * - 検索/フィルタカード
 * - 一覧/サブカード領域（children）
 */
export function ListPageLayout({
  title,
  description,
  searchSection,
  children,
  className,
  'data-testid': dataTestId,
}: ListPageLayoutProps) {
  return (
    <div className={clsx('space-y-8', className)} data-testid={dataTestId}>
      <div className="page-header">
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {searchSection}
      {children}
    </div>
  );
}
