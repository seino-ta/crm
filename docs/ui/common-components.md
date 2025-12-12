# 共通UIコンポーネント一覧

- `DateInput` / `DateRangeInput`: ラベル付きの日付単体/期間入力。`type="date"` を内蔵。  
- `ListSearchCard`: 検索カードのひな型。`action`, `clearHref`, `submitLabel`, `clearLabel`, `hiddenFields` を渡し、子に検索フィールドを入れる。`page=1` hidden を自動付与。  
- `EmptyState`: 空状態の表示。`title` 必須、`description`/`action`/`icon` は任意。  
- `ListToolbar`: 上部ツールバー。`summary`（サマリ文言）と `right`（PageSizeSelector など）を受け取る。  
- `Skeleton/CardSkeleton`, `Skeleton/TableSkeleton`: ローディング用スケルトン。  
- `FilterPill`: 現在のフィルタ表示とクリアボタン。

使い方は `apps/web/src/app/(dashboard)/activities/page.tsx` や `.../leads/page.tsx` を参照。
