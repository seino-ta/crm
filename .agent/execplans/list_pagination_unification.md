# ExecPlan: 一覧ページのページングUI統一

## メタ情報
- バージョン: v0.1 (2025-12-08 作成)
- オーナー: Codex エージェント
- 対象リポジトリ: ~/work/crm (apps/web フロントエンド)
- 参照資料: AGENTS.md, 監査ログ UI 実装 (`apps/web/src/app/(dashboard)/admin/audit-logs/page.tsx`)

## 背景
- 監査ログページが理想形のページング UI（PageSizeSelector をツールバー右、長い一覧時のみ上部 PaginationBarLite、下部 PaginationBar、Prev/Next リンクスタイル、ロケール対応）を実装済み。
- 他のエンティティ一覧（Accounts/Contacts/Leads/Opportunities/Activities/Tasks/Admin Users）が部分的に適用済みだが、細部や配置が一致していないため UX が揃っていない。

## ゴール
1. 上記すべての一覧ページが監査ログと同一レイアウト・挙動のページング UI を持つ（PageSizeSelector、PaginationBarLite 条件表示、PaginationBar 非表示条件、Prev/Next スタイル、ロケールラベル一致）。
2. 既存の検索・フィルタフォームのレイアウトが崩れず、PageSizeSelector の hiddenFields でフィルタが保持される。
3. PageSizeSelector は onChange 自動 submit（Apply ボタンなし）で、page=1 を hidden として引き継ぐ。

## 非ゴール
- 監査ログページの挙動変更。
- API/バックエンドのページングロジック変更。

## アプローチ / ワークストリーム
- WS1: 監査ログページを基準にコンポーネント配置・props を確認し、共通化すべきポイントを checklist 化。
- WS2: 対象一覧ページ（accounts, contacts, leads, opportunities, activities, tasks, admin/users）を順に修正し、PageSizeSelector/PaginationBarLite/PaginationBar/locale/Prev-Next スタイルを揃える。
- WS3: 目視確認と簡易 lint (`npm --prefix apps/web run lint`) を実行し、必要なら微修正。

## スケジュール目安
- WS1: 0.25 日
- WS2: 0.75 日（ページごと 10〜15 分想定）
- WS3: 0.25 日

## 受け入れ基準
- 対象すべての一覧ページで、totalPages>2 のときのみ上部 PaginationBarLite が表示され、totalPages<=1 では下部 PaginationBar が非表示。
- PageSizeSelector に `label` (ja: 最大表示数 / en: Max rows) が設定され、hiddenFields でフィルタと page=1 が渡る。
- Prev/Next のスタイル・文言が監査ログと一致し、ロケールに応じて切り替わる。
- `npm --prefix apps/web run lint` が成功する（ローカル確認ベース）。

## Progress
- [x] WS1 監査ログ基準チェック
- [x] WS2 各一覧ページ修正
- [x] WS3 lint & 目視確認

## Surprises & Discoveries
- Admin Users ページで `isLongList` が二重定義されており、型エラー要因になっていた。

## Decision Log
- ツールバー配置は監査ログと同じ `flex flex-wrap items-end justify-between gap-3` + `mt-4` で統一し、検索フォームの hidden `page=1` を漏れなく入れる方針にした。

## Outcomes & Retrospective
- `npm --prefix apps/web run lint` は警告のみ (既存の未使用変数など) で完了し、致命的エラーなし。
