# ExecPlan: 一覧フロー（検索/ページング/CRUD/権限/バリデーション）E2E強化

## メタ情報
- バージョン: v0.1 (2025-12-12 作成)
- オーナー: Codex エージェント
- 対象: apps/web/tests/e2e
- 関連プラン: list_layout_template / ui_common_components

## 背景
- 検索＋ページング＋最大件数の組み合わせが既存E2Eで未網羅。
- 最近のレイアウト共通化・ハイドレーション修正に対し回帰検知を強化したい。

## ゴール
1. 主要一覧（Accounts, Contacts, Leads, Opportunities, Activities, Tasks, Users, Audit Logs）で検索→ページサイズ変更→ページングの基本フローを自動テスト。
2. 検索条件変更時に page が 1 にリセットされることを検証。
3. page が totalPages を超えた場合、最終ページへリダイレクトされることを検証。
4. EmptyState 表示を 0 件時に確認（例: Contacts）。
5. CRUD 網羅: 作成・参照・更新・削除（ソフト/ハード）を主要エンティティでカバー（Accounts/Contacts/Leads/Opportunities/Tasks/Users）。
6. 権限: ADMIN と REP でメニュー・操作可否の差分を確認（代表シナリオ）。
7. バリデーション/エラーハンドリング: 必須未入力・重複メール・API 4xx/5xx モック時のトースト/メッセージ確認。
8. 日付フィルタ/期間検索がある画面での正常/空/境界（from>to など）確認。
9. Lint/E2E を通過。

## アプローチ
- 追加/拡張するテスト（Playwright）
  - 検索×ページング×最大件数: Accounts, Tasks, Users, Opportunities, Audit Logs（フィルタ維持も確認）
  - pageリセット: 検索条件変更で page=1 になる（Tasks/Accounts）
  - page>total リダイレクト: 任意1画面（Tasks）で確認
  - EmptyState: Contacts（検索0件）
  - CRUD:
    - 作成: Accounts/Contacts/Leads/Opportunities/Tasks/Users
    - 更新: Accounts(編集), Contacts(編集), Leads(ステータス), Opportunities(ステージ), Users(ロール/有効), Tasks(ステータス)
    - 削除: Contacts(ソフト), Tasks/Opportunities(削除 or トグル), Users(無効化で代替)
  - 権限: ADMIN vs REP でメニュー表示と操作可否（最低1シナリオ）
  - バリデーション: 必須未入力でエラーメッセージ、Users の重複メール、API モック 500 でエラートースト
  - 日付フィルタ: Audit Logs 期間検索（from/to）、Activities/Tasks に日付フィルタ追加後にテスト（現状あれば対応、なければスキップ可）
- `safeGoto` 等の共通 helper を再利用。必要ならテスト専用 util を追加（URL 検証、リトライ）。

## 受け入れ基準
- 上記シナリオが自動化され、ローカルで `npm run test:e2e` もしくは対象 grep でパス。
- 失敗時に原因を特定できるアサーション（URL/件数/visible）を含む。

## Progress
- [x] シナリオ設計詳細化
- [x] テスト実装（追加/既存拡張）
- [x] 実行・調整
- [x] Lint/E2E 確認

## Surprises & Discoveries
- Server Actions 経由の API 呼び出しはブラウザ側からの route mock が効かないため、4xx/5xx モックは別途仕込みが必要。今回はバリデーションエラー（min length）で先にカバー。
- Tasks 一覧ページで `redirect` 未 import により page>total でもクエリが 999 のままになる潜在バグを発見し修正。
- 500 系モックは未対応だが、重複メール招待で 4xx エラートーストを再現する E2E を追加。日付境界（from>to）の空ケースは Audit Logs でカバー。
- Tasks/Activities に日付フィルタを実装し、範囲指定／from>to での空状態、パラメータ保持を E2E で確認。

## Decision Log
- 一覧フロー強化として Accounts/Opportunities/Audit Logs の検索×ページサイズ×ページング、ページリセット、Empty 状態、バリデーション、権限差分 (ADMIN vs REP) を list-flows E2E に追加。
- API 500 系のモックは Server Action 経路をどう扱うか検討後に追加予定。
- Tasks page の page overflow 時リダイレクトを有効にするため `next/navigation` から redirect を import する修正を採用。
- Error handling については、Users 招待の重複メールで requestFailed を検証するシナリオを追加し、優先度を 4xx -> 500 の順で拡張する方針。
- 日付フィルタ（Activities: from/to, Tasks: dueAfter/dueBefore）を UI とサーバーフェッチに追加し、E2E で確認する方針を完了。

## Outcomes & Retrospective
- (未記入)

## Next Steps / Backlog
- Tasks / Activities に日付フィルタ UI が入ったら、境界ケース（from>to、同日、空結果）のE2Eを追加し、本プランをクローズする。→ 実装・テスト済み。
- Server Action 経由で 500 系を再現するモック手段を決め、エラートースト検証を追加する。
- Playwright 並列実行（workers>1）での安定性確認を行い、必要に応じて待機/リトライを調整する。
