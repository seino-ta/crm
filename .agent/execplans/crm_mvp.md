# ExecPlan: CRM MVP

## メタ情報
- バージョン: v1.0 (2025-11-18 作成)
- 作成者: Codex エージェント
- ソース: README / AGENTS.md / .agent/PLANS.md に基づく初期計画

## 背景と目的
- このリポジトリでは Node.js / Express / Prisma / PostgreSQL を用いてフル機能 CRM を構築する。
- 最初のマイルストーンはコア CRM エンティティと基本ワークフロー (アカウント・コンタクト管理、案件・活動トラッキング) を備えた MVP を完成させること。
- 本計画は MVP に必要なアーキテクチャ、機能、工程、検証方法を定義し、実装中の意思決定ログとして機能する。

## ゴール
1. Node.js(推奨: v20) + TypeScript ベースの Express API サーバを立ち上げる。
2. Prisma + PostgreSQL で主要エンティティ (User, Account, Contact, Opportunity, PipelineStage, Activity, Task, AuditLog) を正規化したスキーマとして定義し、マイグレーションを提供する。
3. JWT 認証を備えた REST API を実装し、主要 CRUD + 検索/フィルタを提供する。
4. ビジネスワークフロー (案件ステージ管理、活動ログ、自動状態更新) を API レベルで実装する。
5. 自動テスト (unit/integration)・lint・シードデータ・運用ガイドを提供し、再現可能なローカル環境を整備する。
6. バックエンドと同一リポジトリ内にフロントエンド SPA を実装し、主要 CRM ワークフローを UI から操作できるようにする。

## 非ゴール (MVP では扱わない)
- 外部サービス連携 (メール送信、3rd party カレンダー等)
- 高度な分析ダッシュボードやML予測
- マルチテナント/課金/組織管理

## 成果物一覧
- `package.json` とプロジェクト構成 (src/, prisma/, tests/ 等)
- `.env.example` と Docker Compose による Postgres 起動手段
- Prisma schema とマイグレーション、初期シードスクリプト
- Express ルーティング/コントローラ/サービス/リポジトリ層
- 認証・認可ミドルウェア、エラーハンドラ
- Jest + Supertest による主要 API テスト
- 開発/運用ドキュメント (README 追加セクション)
- `apps/api` (既存バックエンド) と `apps/web` (新規フロントエンド) を含む単一リポジトリ構成、共通 lint/test スクリプト

## 前提・制約
- ランタイム: Node.js 20.x, npm 10+ (nvm 推奨)
- DB: PostgreSQL 15+。ローカルは Docker, 本番はマネージドを想定。
- 言語: TypeScript。ESLint + Prettier でコーディング規約を統一。
- デプロイ先は未定だが 12-factor 原則に従い `.env` から設定。
- 認証はまずシンプルな email + password + JWT。将来的に OAuth を追加できるよう抽象化。

## ステークホルダー / 想定利用者
- 営業チーム: アカウント・案件の進捗管理、活動ログの共有
- CS/サポート: コンタクト情報参照、タスク割当
- 管理者: ユーザー管理、権限設定、監査ログ確認
- 開発チーム: 将来の機能追加に備えたモジュール性確保

## 高レベルアーキテクチャ
- Express (Routing) → Controller → Service → Repository(Prisma) のレイヤード構成
- 共通モジュール: 認証/AuthZ, バリデーション (zod/class-validator), エラーハンドラ, ロガー (pino)
- Prisma Client を依拠し、トランザクションと楽観ロックで整合性確保
- HTTP API (REST) + OpenAPI 仕様下書き (tsdoc → swagger)

## データモデル方針
- `User`: アプリ利用者。ロール (admin, manager, rep)
- `Account`: 企業/顧客単位。担当者(User)への多対多 (through AccountAssignment)
- `Contact`: Account に属する人物。複数の案件へリンク可
- `Opportunity`: パイプラインを進む売上案件。金額・確度・予想クローズ日
- `PipelineStage`: 案件ステージ (例: Prospect, Qualified, Proposal, Negotiation, Closed)
- `Activity`: 任意のインタラクション (call/email/meeting)。User + Account/Contact + Opportunity に関連付け
- `Task`: フォローアップ ToDo (due date, status)
- `AuditLog`: 重要エンティティの変更履歴
- 参照整合性とソフトデリート (deletedAt) をサポート

## 主要機能要件
1. 認証/ユーザー管理: サインアップ(初期のみ), ログイン, ロールに基づく API 保護
2. アカウント/コンタクト CRUD: ページネーション、フィルタ、検索 (会社名/メール)
3. 案件管理: ステージ更新、金額集計、確度・予測日入力
4. 活動ログ & タスク: 作成、完了ステータス、関連オブジェクトの参照
5. レポート API (簡易): 案件ステージ別集計、担当者別パイプライン総額
6. 監査ログ: 重要更新 (ステージ変更、削除) を保存し取得できる

## ワークストリーム & タスク分解
### WS1: プロジェクト基盤 (Week 1)
- Node/TypeScript/Express 初期セットアップ、`tsconfig`, ESLint/Prettier, husky(optional)
- Docker Compose (app + postgres)・`.env.example`
- ロガー・共通レスポンスフォーマット・エラーハンドラ

### WS2: データレイヤ (Week 1-2)
- Prisma 初期化、schema 設計、正規化・リレーション定義
- マイグレーション生成、`prisma seed` でデモデータ投入
- PrismaClient ラッパー、リポジトリ共通ユーティリティ

### WS3: 認証/認可 (Week 2)
- bcrypt によるパスワードハッシュ
- JWT 発行/検証、リフレッシュ(任意)の検討
- ロールベースミドルウェアとアクセス制御ルール

### WS4: コア CRUD API (Week 2-3)
- Account, Contact, Opportunity, PipelineStage コントローラ + サービス
- バリデーションスキーマ、パラメータ化検索/フィルタ
- ソフトデリート & 監査ログフック

### WS5: ワークフロー機能 (Week 3)
- Activity & Task API、リマインダーロジック
- Opportunity ステージ遷移時の副作用 (自動活動作成、日付更新)
- 集計レポート API

### WS6: 品質保証 & DX (Week 3-4)
- Jest/Supertest で API テスト、CI (GitHub Actions) 雛形
- OpenAPI 仕様生成、README 更新
- 指標: カバレッジ 70% 以上、lint/test npm script

### WS6: フロントエンド (Week 5-6)
- リポジトリを monorepo（例: `apps/api`, `apps/web`, `packages/*`）に整理し、共通 lint/test/ビルドスクリプトを整備
- Next.js + React + TypeScript + Tailwind/Chakra などを用いた SPA を構築し、主要エンティティ (Accounts/Contacts/Opportunities/Activities/Tasks) の CRUD UI とグローバルナビゲーションを実装
- Auth フロー（ログインフォーム、JWT 保存、API 呼び出しラッパ）とロールに応じた表示制御
- レポート/ダッシュボードの簡易カード (stage summary, owner pipeline) を実装し、API 連携を検証
- E2E/統合テスト (Playwright など) を追加し、バックエンド API と合わせて CI で実行

## マイルストーン
1. **M1 (週1)**: WS1 完了。ローカル環境でサーバ起動、ヘルスチェック API 動作
2. **M2 (週2)**: WS2 + Prisma マイグレーション安定
3. **M3 (週3)**: 認証 + コア CRUD API β 公開
4. **M4 (週4)**: ワークフロー/レポート + テスト/ドキュメント整備で MVP 完成

## 受入基準
- `npm run dev` でホットリロード起動し、Postgres と接続できる
- Postman/HTTPie から主要 CRUD が 200 応答し、検証ルールが作動
- DB にマイグレーション + シードを適用後、3 件以上のダミーデータで UI なしでも検証可能
- Lint/Test が CI で成功、90% 以上の主要ルートがテストでカバー
- README にセットアップ・API 要約・トラブルシューティングが明記

## テストと検証戦略
- Unit: サービス層のビジネスロジック (jest-mock)
- Integration: Supertest + test Postgres (docker) で REST エンドツーエンド
- Prisma: `prisma migrate dev --name` を CI で dry-run
- シード/マイグレーションは GitHub Actions の `prisma migrate deploy` で検証
- セキュリティ: JWT 失効/権限テスト、OWASP ASVS 高優先項目の静的チェック

## 運用・監視方針
- pino + pino-pretty で構造化ログ。ステージに応じた log level 切替
- healthz / readyz エンドポイント
- 例外通知は将来 Sentry 導入を想定し、エラーハンドラを抽象化

## リスクと軽減策
- スコープ膨張 → MVP スコープの非ゴールを厳守し、追加要望は別 ExecPlan へ
- データモデル複雑化 → ER 図/Prisma schema を先にレビュー、`prisma format` で整合性確保
- 認証まわりの脆弱性 → 早期にセキュリティテスト、自動 `npm audit` を CI に含める
- DB マイグレーション衝突 → feature branch 毎に `prisma migrate diff` を実行、手順を README 化

## 依存関係
- npm パッケージ: express, prisma, @prisma/client, zod(or class-validator), bcrypt, jsonwebtoken, pino, jest, ts-jest, supertest
- 開発ツール: Docker Desktop, GitHub Actions, VSCode devcontainer (任意)

## Progress
- 2025-11-18: ExecPlan v1.0 作成 (Codex)
- 2025-11-18: WS1 完了 — Node/TS/Express 基盤、lint/format、ロガー/エラーハンドラ、Docker Compose/.env を整備
- 2025-11-18: WS2 データレイヤ完了 — Prisma schema/migration/seed、Prisma Client ヘルパー、README を更新
- 2025-11-18: WS3 認証/認可基盤完了 — bcrypt/JWT ベースのサインアップ/ログイン/自己参照 API と RBAC ミドルウェアを実装
- 2025-11-18: WS4 フェーズ1 完了 — Account/Contact の CRUD API・検索・ソフトデリート・README 反映を実装
- 2025-11-18: WS4 フェーズ2 完了 — PipelineStage/Opportunity API (検索, ステージ更新, 監査ログ) を実装
- 2025-11-18: WS4 フェーズ3 完了 — AuditLog 参照 API、共通テスト基盤 (Jest) とユニットテストを追加
- 2025-11-18: WS5 フェーズ1 完了 — Activity/Task API とワークフロー基盤を実装
- 2025-11-18: WS5 フェーズ2 完了 — Pipeline レポート API を追加し、ステージ変更時の自動 Activity/Task 副作用を実装
- 2025-11-19: WS6 着手 — monorepo へ再構成し、Next.js + Playwright によるフロントエンド実装を開始（`apps/web` 追加、主要画面の UI を構築中）

## Surprises & Discoveries
- (未記入)

## Decision Log
- 2025-11-18: API は TypeScript + Express の REST で実装し、Prisma を ORM とする
- 2025-11-18: MVP 認証は Email/Password + JWT で開始し、OAUTH は後続に回す
- 2025-11-18: ローカル開発は ts-node-dev + ESLint Flat Config を採用し、pino-http ベースの構造化ログと Docker Compose(api+db) を標準とする
- 2025-11-18: Prisma モデルは UUID 主キーとソフトデリート対応 (Account/Contact/Opportunity) とし、AccountAssignment 経由で多対多を表現する
- 2025-11-18: Prisma マイグレーションは `migrate diff` で生成し、`prisma/seed.ts` で決定的 ID を用いたシードデータを提供する
- 2025-11-18: 認証には bcryptjs + JWT (HS256) を採用し、Zod でバリデーション、ミドルウェアでロールチェックを行う
- 2025-11-18: Opportunity のステージ変更時に確率/ステータス自動調整と監査ログ記録を行う
- 2025-11-18: Activity/Task API は関連エンティティ存在チェックとページネーションを標準とし、タスク完了で `completedAt` を自動設定する
- 2025-11-18: リポジトリはバックエンドとフロントエンドを同居させ、共通の lint/test/CI を適用する monorepo 方針とする

## Outcomes & Retrospective
- (未記入)
