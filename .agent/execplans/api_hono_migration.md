# ExecPlan: Cloudflare Workers対応に向けたAPIのHono移行

## メタ情報
- バージョン: v1.0 (2025-12-17 作成)
- 作成者: Codex エージェント
- 目的: `apps/api` のExpress実装をHono + Cloudflare Workers向けに移行し、D1ベースのサーバレス実行に対応する。

## 背景と動機
- フロントエンドをCloudflare Pagesに載せる方針に合わせ、APIも同一プラットフォームでホストしたい。
- 現状のExpress依存コードはNode.js固有のAPIやミドルウェアに依存しており、そのままWorkers上で動かせない。
- Cloudflare D1 + Prisma構成を採用することで、無料枠での永続データを確保しつつインフラを単純化する狙いがある。

## ゴール
1. Expressアプリと同等のRESTエンドポイントをHono実装で再現し、Cloudflare Workers/Pages Functionsにデプロイ可能にする。
2. Prisma + `@prisma/adapter-d1` でD1へ接続できるようスキーマ・設定・マイグレーション手順を更新する。
3. ローカル開発・自動テスト・デプロイフローをWrangler中心に再構築し、monorepo内のDXを維持する。
4. 主要E2E/統合テストでリグレッションが無いことを証明し、移行手順をREADME/Docsに残す。

## スコープ
- `apps/api/src` のエントリポイント、ルーティング、ミドルウェア、DI層のHono化。
- Cloudflare Workers向けビルド構成 (`wrangler.toml`, npm scripts, esbuild/Vite設定) の追加。
- Prisma schema/provider更新と`@prisma/adapter-d1`導入、D1マイグレーション手順整備。
- テスト戦略更新（Unit/JestはNodeで継続、E2EはMiniflare or Wrangler devで実行）。
- 環境変数/Secrets管理の置き換え（`process.env`→`env`バインド）。
- ドキュメント更新（README, docs/Cloudflare, ExecPlan Progressなど）。

## 非スコープ
- 新規API機能やビジネスロジック変更。
- D1以外のマネージドDB移行（必要なら別ExecPlan）。
- Web UI側の大幅な改修（API通信先URL切替のみ）。
- Observability/Sentry等の追加導入。

## アーキテクチャ方針
- Honoをベースにルーティング層を再構築し、既存のサービス/リポジトリ層は極力再利用する。
- Node専用ミドルウェア（helmet, cors等）はHono/Workers対応版へ置き換えまたは自作する。
- Prisma Clientは`prisma generate --no-engine`（Workers対応ビルド）＋`@prisma/adapter-d1`を利用。
- Cloudflare D1 は`[[d1_databases]]`バインドで管理し、本番は`wrangler d1 migrations apply`、ローカルは`wrangler d1 --local`で再現。
- ビルドはesbuild/Viteで`src/worker.ts`をESMバンドルし、Wranglerへデプロイ。Node向け`server.ts`は段階的に廃止する。

## ワークストリーム / タスク
### WS1: 現状分析と対象範囲の棚卸し (1日)
- 各ルート/ミドルウェア/サービス依存を調査し、Hono化必要リストを作成。
- Node固有APIの利用箇所（`req`, `res`, `process`, ストリーム等）を特定し対応方針を決める。

### WS2: HonoベースのHTTPレイヤ構築 (2-3日)
- `src/worker.ts` を追加し、Honoインスタンスを作成。
- 既存のRouterやControllerをHonoハンドラへ移植。zodバリデーションやレスポンス整形を共通ユーティリティ化。
- 認証・エラーハンドリング・ロギングをHonoミドルウェア化し、Workers互換のログ出力（`console.log` + Cloudflare Structured Logging）へ切替。

### WS3: Prisma + D1統合 (2日)
- `prisma/schema.prisma` をD1向け（provider=`sqlite`）へ更新し、必要な互換調整（autoincrement→`autoincrement()` or `cuid`）。
- `@prisma/adapter-d1` 導入、`PrismaClient` 初期化コードを`env.DB`バインドベースに変更。
- マイグレーションフロー: `prisma migrate diff`→SQL→`wrangler d1 migrations apply`の手順をスクリプト化。

### WS4: Wrangler設定とビルド/デプロイフロー (1-2日)
- `wrangler.toml` 作成（環境別セクション、Bindings、Durable Objects未使用の明記）。
- npm scripts更新 (`api:dev:cf`, `api:deploy:cf`, `api:test:cf`) を定義。
- CI（GitHub Actions想定）へWrangler CLIを組み込み、Preview/Productionデプロイ手順を作成。

### WS5: テスト/検証更新 (2日)
- Unit/IntegrationテストがHonoハンドラに対して動くよう`supertest`→`@hono/node-server`/`Miniflare`ベースに調整。
- `apps/api/tests` をWorkers環境で再実行し、Cloudflare提供の`workerd`テストランナーや`miniflare`でE2Eを実施。
- `apps/web`のAPIクライアントを新エンドポイントに向け、Playwright E2Eを再検証。

### WS6: ドキュメントと切替手順 (1日)
- README / docs 配下に「Workers + Hono + D1 セットアップ」セクションを追加。
- 既存デプロイ手順との共存期間を明記し、切替フラグ（Feature toggle or env `API_RUNTIME=worker`）を定義。
- ExecPlanのProgress/Decision/Surprisesを更新し、完了後にOutcomesへ所感を記録。

## Acceptance Criteria
- `wrangler dev --local` でAPIが起動し、主要エンドポイント (Auth, Accounts, Contacts, Opportunities) が200を返す。
- `npm --prefix apps/api run build` がWorkers向けバンドルを生成し、`wrangler deploy` が成功。
- Prisma CLIでD1へマイグレーションを適用し、Cloudflareダッシュボード上のデータが期待通り更新される。
- `npm run test:api` (更新後) がHono実装に対して成功し、主要業務フローがカバーされる。
- README/DocsにHono/Workers運用手順、D1移行注意点、ロールバック方法が文書化される。

## 依存・リスク・軽減策
- **Prisma Workers対応の制限**: バンドルサイズやトランザクション未対応。→ クリティカルな複雑トランザクションはアプリ側で再設計、必要ならHyperdrive + Postgres案を温存。
- **ライブラリ互換性**: Express専用ミドルウェアが使えない。→ Honoネイティブ/自前実装で代替し、互換レイヤーを段階的に削除。
- **テスト環境差**: Miniflareと本番Workersの差異。→ `wrangler dev --remote` をCIで1度実行し、本番同等環境でスモークテスト。
- **移行期間の二重運用**: 旧Expressと新Honoが並行。→ Feature flag + env切替で段階的リリース、切替手順をドキュメント化。

## Progress
- 2025-12-17: v1.0 作成
- 2025-12-17: WS1-WS5 完了。Hono エントリ (`src/app.ts`/`worker.ts`), Cloudflare runtime config, Prisma D1 対応、Jest/E2E テスト調整、Wrangler 設定を実装。`npm run test` / `npm run test:e2e` が通過。
- 2025-12-19: WS6 完了。README を Hono + Workers + D1 前提に全面改稿し、ローカルセットアップ/DB初期化/テスト/デプロイ手順を反映。

## Surprises & Discoveries
- Prisma schema engine が local SQLite (`prisma migrate reset`) で動作しない。→ Jest GlobalSetup では `sqlite3` CLI で migration SQL を直接適用し、seed を `ts-node` で流すよう切替。
- `@prisma/adapter-d1` が `ky` に依存し Jest(CJS) で読み込めない。→ `tests/setup/mock-prisma-d1.js` を追加し、Unit/E2E 両方の Jest でモックすることで Node 実行時の import を回避。
- SQLite では `createMany` の `skipDuplicates` が未サポート。→ Seed スクリプトから除去し、重複チェックはアプリ側で担保。

## Decision Log
- 2025-12-17: API層をHono + Cloudflare Workersへ再構築し、PrismaはD1アダプタで運用する方針を採用。
- 2025-12-17: ローカルテストでは Prisma CLI ではなく `sqlite3` + migration SQL を用いてDB初期化する運用に決定。
- 2025-12-17: Jest では `@prisma/adapter-d1` をモックし、Nodeランタイムでは常に Prisma NodeClient 経由で DB へ接続する。

## Outcomes & Retrospective
- Hono + Cloudflare 向け API 構成に刷新し、Workers バインディング/Node dual runtime の初期化を `src/config/*` に集約できた。
- Prisma schema を D1 (SQLite) 向けに整理し、マイグレーション/seed/テストフローを Cloudflare 想定で再構築できた。
- README を最新構成に同期し、絶対パスベースの `DATABASE_URL` 管理や Wrangler dev 手順、E2E/Playwright の実行フローを手順化できた。
- Jest (unit) / Jest e2e がいずれもグリーンになり、ローカル＋Wrangler dev いずれでも同等の API 振る舞いを確認済み。
