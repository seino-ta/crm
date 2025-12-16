# ExecPlan: API E2E (Integration) Tests

## メタ情報
- バージョン: v1.0 (2025-12-15 作成)
- 作成者: Codex エージェント
- 参照ソース: AGENTS.md / README.md / apps/api package.json / prisma schema & seed / docker-compose.yml

## 背景と目的
- 現状 API はユニットテストのみで、実 DB とルーティング全体を通す E2E 相当の検証がない。
- フロントの Playwright 依存を下支えし、バックエンド単体で主要フローの信頼性を担保するテストを追加する。

## ゴール
1. Postgres + Prisma を使った実 DB で API 主要フローを supertest 経由で検証する。
2. `npm --prefix apps/api run test:e2e` でセットアップからテスト実行まで自動化する（DB 初期化・seed 含む）。
3. `.env.test` / CI 手順を明文化し、開発者がローカルでも CI でも再現可能にする。
4. 主要エンティティ (auth/accounts/opportunities/tasks/leads/contacts/audit-logs) のハッピーパスと基本的な権限制御を網羅する。

## 非ゴール
- 負荷・パフォーマンステスト
- 契約テスト (OpenAPI/Schema) の生成
- サービス間通信 (外部 API) のモック拡張
- Web フロントの Playwright 追加カバレッジ

## 成果物
- `apps/api/tests/e2e/*.test.ts` 一式
- テスト用ユーティリティ: supertest ラッパ、認証トークン取得/注入、DB リセット + seed を行う global setup/teardown
- `.env.test.example` と README 追記 (DATABASE_URL_TEST / JWT_SECRET など)
- `apps/api/package.json` に `test:e2e` 追加（必要に応じて root `test:api` へ組み込み）、スクリプトで使う `prisma migrate deploy` / `db:seed`
- CI 用ジョブ (既存 CI があれば拡張) で `test:e2e` を実行

## スコープ (対象エンドポイント/フロー)
- `/api/healthz` readiness check
- `/api/auth/login` → JWT 取得
- Accounts: list → create → update → soft delete、role-based access (ADMIN/MANAGER/REP)
- Contacts: create → fetch
- Opportunities: stage change & amount update、audit-log への反映確認
- Tasks: create → complete → filter/list
- Leads: create → status 更新 → soft delete
- Audit logs: CRUD 操作後の最新エントリが参照できること

## 実装ストリーム
1) テスト基盤  
   - `.env.test.example` を作成し、`NODE_ENV=test` で `DATABASE_URL_TEST` を優先利用するよう config/Prisma を確認・補強  
   - Jest globalSetup/globalTeardown で `prisma migrate deploy` + `prisma db seed` を test DB に実行し、完了後に主要テーブルをクリーンアップ（truncate）  
   - supertest 対象として `app` を直接インポートしサーバープロセス不要で叩ける仕組みを共通化  

2) テストユーティリティ  
   - `tests/e2e/helpers/auth.ts` で seed ユーザー (admin/manager) でログインし、`Authorization: Bearer` を付与する関数  
   - `tests/e2e/helpers/db.ts` で主要テーブル truncate/sequence reset を実装 (Prisma + raw SQL)  
   - 共通 Factory (UUID 発行、payload デフォルト) を `tests/e2e/factories/*` に配置  

3) E2E シナリオ実装  
   - Auth: 正常 / 誤認証  
   - Accounts: CRUD + owner/manager 権限確認  
   - Contacts + Opportunities + Tasks + Leads: ハッピーパス + 403/404 の主要ケース  
   - Audit log: CRUD 操作後に最新エントリが作成されていることを確認  

4) スクリプトとドキュメント  
   - `apps/api/package.json` へ `test:e2e` 追加（例: `cross-env NODE_ENV=test DATABASE_URL=$DATABASE_URL_TEST jest --runInBand --config jest.e2e.config.ts`）  
   - README / `.env.example` に test 実行手順・依存サービス (Postgres) 起動方法・サンプル env を追記  
   - CI (例: GitHub Actions) に Postgres サービスと `npm run test:api -- --selectProjects e2e` などを追加  

## バリデーション / 受け入れ基準
- Postgres が起動している環境で `DATABASE_URL_TEST` を指定し `npm --prefix apps/api run test:e2e` が 1 コマンドで成功する
- テストは DB を汚さず、再実行しても deterministic に通る
- 最低限: auth/login, accounts CRUD, opportunities stage 更新, tasks 完了, audit log 作成がカバーされる
- CI で e2e ジョブを追加した場合、他ジョブに影響なく完走する

## Progress
- 2025-12-15: v1.0 作成
- 2025-12-15: テスト基盤の雛形追加（jest.e2e.config.ts / globalSetup・Teardown / helpers / health・auth サンプル）と `.env.test.example` 作成、`DATABASE_URL_TEST` 優先読み込みを env 設定に反映
- 2025-12-15: テスト用 Postgres を `docker-compose.test.yml` で追加し、`db:test:up`/`db:test:down` スクリプトをルート・API両方に用意
- 2025-12-15: Accounts CRUD E2E テストを追加（accounts.test.ts）
- 2025-12-15: CRM 全メニューのハッピーパス＋検索カバレッジを追加（crm-flows.test.ts）
- 2025-12-15: globalSetup でテストDBを `migrate reset`→`deploy`→`seed` に変更し、種データ未投入による認証失敗を解消。`@types/supertest` 追加。E2E 全件成功を確認。
- 2025-12-16: Reports API E2E を追加（pipeline-stage / owner 両エンドポイントで新規商談を検証）

## Surprises & Discoveries
- (未記入)

## Decision Log
- 2025-12-15: supertest で app を直接呼び出し、外部ポートに依存しない形で e2e を実装する方針
- 2025-12-15: テスト DB は `DATABASE_URL_TEST` を必須とし、migrate + seed をグローバルセットアップで適用する方針

## Outcomes & Retrospective
- (未記入)
