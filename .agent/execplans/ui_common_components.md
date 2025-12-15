# ExecPlan: 共通UIコンポーネント整備（日付/検索カード/EmptyStateほか）

## メタ情報
- バージョン: v0.1 (2025-12-12 作成)
- オーナー: Codex エージェント
- 対象リポジトリ: ~/work/crm (apps/web)
- 親プラン: 一覧レイアウト統一 / テンプレート化（list_layout_template）
- スコープ: 日付入力/表示、検索カード、EmptyState、ロードスケルトン、フィルタPill の共通コンポーネント追加と既存画面への置き換え（段階的）

## 背景
- 一覧レイアウトは統一できたが、日付入力や空状態などが画面ごとにバラつき、UX/メンテ性が低下する恐れ。
- 新規ページ作成時に使える共通パーツを揃えておきたい。

## ゴール
1. 共通 DateInput/DateRangeInput（FloatingInput 互換のラベル/例示/バリデーション付き）を提供。
2. 検索カードのスニペット化（ListSearchCard）で hidden page=1, 検索/クリアボタンの繰り返しを排除。
3. EmptyState コンポーネント（アイコン/タイトル/説明/CTA optional）を用意。
4. ローディング用 Skeleton（CardSkeleton, TableSkeleton）を用意。
5. FilterPill/FilterChips で現在のフィルタ表示＆リセットを共通化（必要最小）。
6. 代表ページを置き換え、利用例を残す。
7. Lint/E2E を通過。

## アプローチ
- コンポーネント追加（apps/web/src/components/ui/ 配下想定）  
  - `date-input.tsx`（単日） / `date-range-input.tsx`（from/to）  
  - `list-search-card.tsx`（childrenにフォーム要素を渡す or render prop）  
  - `empty-state.tsx`  
  - `skeleton/card-skeleton.tsx`, `skeleton/table-skeleton.tsx`  
  - `filter-pill.tsx`（単一/クリア）および chips オプション
- 翻訳: 共通ラベルを `common` に追加（Clear, Date placeholders 等必要分）。
- パイロット置き換え: 影響小さいページから（例: Activities の検索日付があれば適用、空状態は Contacts/Tasks などで適用）。
- ドキュメント: `docs/ui/common-components.md` に使い方例を追加。
- チェックリスト更新: PR checklist に「共通コンポーネント活用」を追加。
- 段階的実装: もし差分が大きければコンポーネント追加→一部適用→残り適用で分割コミット。

## 受け入れ基準
- 上記コンポーネントが存在し、少なくとも1〜2画面で適用例が確認できる。
- 既存の動作回帰がない（lint / e2e OK）。
- ドキュメントとチェックリストで利用方法が明記されている。

## Progress
- [x] コンポーネントAPI設計（DateInput / SearchCard / EmptyState / Skeleton / FilterPill）
- [x] 実装（コンポーネント追加）
- [ ] 翻訳追加（common系）※現状既存キーで対応
- [x] ドキュメント追加
- [x] チェックリスト更新
- [x] パイロット適用（Activities: ListSearchCard、Contacts: EmptyState）
- [x] Lint / e2e 確認

## Surprises & Discoveries
- (未記入)

## Decision Log
- (未記入)

### ラベル/用語統一時の再発防止チェック（セッション切れても参照可）
- 対象洗い出しを最初に実行: `rg 'name="search"' apps/web/src/app/(dashboard)` で全一覧ページを列挙し、チェックボックス化して対応可否を記録する。
- ルールを明文化: 「検索」→「キーワード」（英: Keyword）を一覧検索入力の既定ラベルとする。例外は必ず記録。
- 適用後に再grep: 同コマンドで残存箇所がないことを確認し、PR 描述に明記する。
- まとめ作業手順（固定）: 1) 全体grep→対象リスト化 2) 一括置換/個別修正 3) 再grepで漏れ確認 4) 必要ならE2E/スナップショットで文言差分を確認。
- PR テンプレのチェック項目に「用語統一対象をgrepで網羅確認済み」を追加する（別PRで実施）。

## Outcomes & Retrospective
- (未記入)
