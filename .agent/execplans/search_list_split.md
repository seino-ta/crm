# ExecPlan: 検索コンポーネント分割と一覧UI整理

## メタ情報
- バージョン: v0.1 (2025-12-12 作成)
- オーナー: Codex エージェント
- 対象リポジトリ: ~/work/crm (apps/web)
- スコープ: Accounts / Opportunities / Activities / Tasks の一覧画面

## 背景
- これらの画面では検索フォームと一覧表示が一体化しており、UI が分かりづらい。
- 依頼: コンタクト画面のようにコンポーネントを分割し、検索はシンプルに、一覧側にページサイズ/ページングを集約。検索項目がない画面にはタイトル検索を追加。

## ゴール
1. Accounts/Opportunities/Activities/Tasks で検索コンポーネントと一覧コンポーネントを分離。
2. 検索コンポーネントは「検索項目 + 検索ボタン」のみ（page=1 hidden）。
3. 一覧コンポーネントは「行の表示 + PageSizeSelector + Prev/Next (PaginationBar/Lite)」。
4. Activities/Tasks にタイトル/件名検索を追加（API側は既に対応済みの search パラメータを利用）。

## アプローチ
- 各ページ内で小さな SearchForm サブコンポーネントを定義し、UI を分割。
- PageSizeSelector と PaginationBar/Lite を一覧セクションに移動。
- Activities/Tasks に検索カードを追加し search パラメータを渡す。
- レイアウトは contacts に近い flex/gap 構成で揃える。

## 受け入れ基準
- 該当4画面で検索フォームと一覧表示が別コンテナになっている。
- 検索フォームには PageSizeSelector が無い。
- 一覧側に PageSizeSelector と PaginationBar/Lite が存在し、ページングが機能。
- Activities/Tasks でタイトル/件名検索ができる。
- `npm --prefix apps/web run lint` が成功する。

## Progress
- [x] 画面毎の分割実装（Accounts）
- [x] 画面毎の分割実装（Opportunities）
- [x] 画面毎の分割実装（Activities）
- [x] 画面毎の分割実装（Tasks）
- [x] Lint 確認

## Surprises & Discoveries
- Playwright レポート出力（apps/web/tests/e2e/report 配下）が ESLint の対象になって大量の警告/エラーを発生させていた。
- e2e 実行（2025-12-12）で Firefox プロジェクトの Activities/Audit Logs がタイムアウト（フォーム入力待ち）する一方、Chromium は全件パス。再現調査が必要。

## Decision Log
- ESLint の ignore 対象に `apps/web/tests/e2e/report` を追加し、既存レポートディレクトリを削除してから lint を再実行した。

## Outcomes & Retrospective
- Accounts/Opportunities/Activities/Tasks で検索カードと一覧カードを分離し、Activities/Tasks にタイトル検索を追加。各一覧に PageSize/Pagination を集約し、`npm --prefix apps/web run lint` を完走済み。
