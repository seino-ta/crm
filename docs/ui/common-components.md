# 共通UIコンポーネント一覧

- `DateInput` / `DateRangeInput`: ラベル付きの日付単体/期間入力。`type="date"` を内蔵。  
- `ListSearchCard`: 検索カードのひな型。`action`, `clearHref`, `submitLabel`, `clearLabel`, `hiddenFields` を渡し、子に検索フィールドを入れる。`page=1` hidden を自動付与。  
- `EmptyState`: 空状態の表示。`title` 必須、`description`/`action`/`icon` は任意。  
- `ListToolbar`: 上部ツールバー。`summary`（サマリ文言）と `right`（PageSizeSelector など）を受け取る。  
- `Skeleton/CardSkeleton`, `Skeleton/TableSkeleton`: ローディング用スケルトン。  
- `FilterPill`: 現在のフィルタ表示とクリアボタン。

使い方は `apps/web/src/app/(dashboard)/activities/page.tsx` や `.../leads/page.tsx` を参照。

## 一覧ページのヘッダー/ボタン配置ルール
- `ListPageLayout` を使う場合、`actions` プロップに「作成」「招待」などのボタンをそのまま渡す。コンポーネント内で `.page-actions` 行が生成され、左スペーサ（`.page-actions__spacer`）で右寄せされる。  
- 独自レイアウトを組む場合も、`<div className="page-actions"><div className="page-actions__spacer" /> ...buttons... </div>` を使って右端揃えにする。  
- これにより Contacts / Admin Users を基準としたボタン位置と余白が Activities / Tasks / Leads / Opportunities でも一致する。

## 作成フロー UI パターン（ガイド）
- 軽量フォーム（Task / Activity / Contact）：一覧の文脈を維持できるモーダル/ドロワーで作成する。
- 中量フォーム（Account / Opportunity / Lead）：スライドオーバー（drawer）を基本とし、保存後に一覧をリフレッシュ。
- 複合フロー（Convert Lead など）：専用ページでステップを踏ませる。例として `/leads/convert` を追加。
- 成功時は `SuccessToast` を使い、`router.refresh()` で一覧を再読込して反映させる。
