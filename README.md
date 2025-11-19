# Full-Featured CRM — Backend Implementation (Node/Express/Prisma/PostgreSQL)

This repository is intentionally minimal.

A coding agent (such as Codex) will design and build the entire backend
CRM system from scratch using **ExecPlans**.

---

# 🎯 Project Goal

Implement a **full-featured CRM** backend including all standard industry
features:

## Core CRM Entities
- **Users & Authentication**
- **Companies**
- **Contacts**
- **Deals**
- **Activities**

Additional features:
- Pipeline stages
- Filtering & searching
- Basic analytics
- Audit fields

---

# 🧱 Technology Stack

- Node.js
- Express
- Prisma
- PostgreSQL
- Optional: TypeScript, Zod

---

# 🧩 Repository Structure (initial)

```
crm-app/
  AGENTS.md
  README.md
  .agent/
    PLANS.md
    execplans/
```

The coding agent will create everything else.

---

# 🚀 How Development Works

1. Agent reads AGENTS.md and .agent/PLANS.md  
2. Agent creates `.agent/execplans/crm_mvp.md`  
3. ExecPlan defines architecture, tasks, validations  
4. Agent executes tasks and updates ExecPlan  

---

# 📌 Human Requirements

You only need to run commands the agent tells you (npm install, prisma migrate, etc.).

---

# ✅ Summary

This repository is prepared so that:

- The agent creates the architecture  
- The agent splits tasks  
- The agent writes all code  
- The agent manages ExecPlans  

---

## 🧭 Monorepo (apps/api + apps/web)

- `apps/api`: Express + Prisma + PostgreSQL で REST API を提供。`npm --prefix apps/api run dev` で単体起動、ポートは `4000`。
- `apps/web`: Next.js 16 (App Router) + React 19 で SSR/CSR ハイブリッド UI を提供。`npm --prefix apps/web run dev` で単体起動、ポートは `3000`。
- ルートの npm scripts (`npm run dev`, `npm run lint`, `npm run test`, `npm run test:e2e` など) は npm workspaces 経由で API/Web を同時に操作する。

### セットアップ (API + Web)

1. Node.js 20 系と npm 10+ を用意する。
2. `cp .env.example .env` でルート環境ファイルを作成し、`DATABASE_URL`、`JWT_SECRET`、`SEED_USER_PASSWORD` などを設定する。
3. `cp apps/web/.env.local.example apps/web/.env.local` を実行し、`NEXT_PUBLIC_API_BASE_URL` (例: `http://localhost:4000/api`) や `API_BASE_URL`、`WEB_PORT` を必要に応じて変更する。
4. `npm install` でワークスペース全体の依存関係を解決する。
5. `npm run dev` で API (http://localhost:4000) と Web (http://localhost:3000) を同時起動する。`.env` / `apps/web/.env.local` が揃っていれば `crm_token` クッキー発行まで確認できる。

### 認証とログインフロー

- シードユーザー: `admin@crm.local` / `ChangeMe123!`、`manager@crm.local` / `ChangeMe123!` (ともに `.env` の `SEED_USER_PASSWORD` を変更すると再シード時に更新される)。
- `/login` フォーム送信は Server Action (`loginAction`) を経由し、成功時に HttpOnly の `crm_token` クッキーを 12 時間保存 → Dashboard (`/dashboard`) へ `redirect()`。
- Next.js の `middleware.ts` が `crm_token` の有無で `/login` と `/dashboard` 配下を制御する。ログアウト (`logoutAction`) はクッキー削除後に `/login` へ戻す。

### npm Scripts / DB マイグレーション

- `npm run dev` — API + Web を並列起動。
- `npm run lint` / `npm run lint:web` / `npm run lint:api` — ESLint (Flat config)。
- `npm run test` — API (Jest) + Web (lint) をまとめて実行。
- `npm run test:api` / `npm --prefix apps/api run test` — API ユニットテスト。
- `npm run test:e2e` — Playwright で Web フローを検証。
- `npm --prefix apps/api run db:migrate` / `npm --prefix apps/api run db:seed` — Prisma でマイグレーション & シードを実行 (必要に応じて `DATABASE_URL=...` を前置)。

### Playwright / UI スナップショット

- `npm run test:e2e` — ログイン → 主要 CRM 画面を自動操作。スクリーンショットやビデオは `test-results/`、`apps/web/tests/e2e/screenshots/` に保存される。
- `npm run ui:snapshots` — `@snapshot` タグ付きテストのみ実行し、UI の diff を確認。
- `npm run playwright:codegen` — `PLAYWRIGHT_BASE_URL` (デフォルト `http://localhost:3000`) を基にブラウザ操作を記録。
- HTML レポート: `npx playwright show-report apps/web/tests/e2e/report`。テストが失敗した場合は `npx playwright show-trace test-results/<run>/trace.zip` で詳細を確認。

### トラブルシュート

- `cookies()` の使用制限: Server Action / Route Handler / Middleware 以外 (例: `'use client'` コンポーネント) では `cookies()` を呼び出せない。クライアントからクッキーを操作したい場合は Server Action を経由して処理する。
- ポート競合 (`EADDRINUSE: 3000` など): `lsof -ti tcp:3000 | xargs kill -9` で既存プロセスを終了するか、`.env.local` の `WEB_PORT` を変更した上で `npm run dev` を再実行する。
- Playwright 失敗時: `test-results/<spec>/` にスクリーンショット・動画・トレースが保存される。`npx playwright show-report apps/web/tests/e2e/report` や `npx playwright show-trace test-results/.../trace.zip` で原因を特定する。

---

## 🧑‍💻 開発セットアップ

1. Node.js 20+ / npm 10+ を用意する (推奨: `nvm` で 20.x を選択)。
2. `.env.example` をコピーして `.env` を作成し、必要に応じて値を変更する。
3. 依存関係をインストール: `npm install`
4. ローカル開発サーバーを起動: `npm run dev`

### 主要 npm スクリプト

- `npm run dev` — ts-node-dev でホットリロード起動
- `npm run build` — TypeScript を `dist/` にコンパイル
- `npm start` — ビルド済みアプリを実行
- `npm run lint` / `npm run lint:fix` — ESLint (Flat config)
- `npm run format` / `npm run format:check` — Prettier

### Docker Compose での起動

```
cp .env.example .env
docker compose up --build
```

- `api` サービスが Express アプリをビルドして 4000 番ポートで公開する。
- `db` サービスは PostgreSQL 15 (ユーザー `crm_user`, DB `crm_db`) を起動する。

## 🧾 環境変数 (.env)

| 変数名 | 説明 | デフォルト例 |
| --- | --- | --- |
| `NODE_ENV` | 実行環境 (development/test/production) | `development` |
| `PORT` | API ポート | `4000` |
| `LOG_LEVEL` | pino ログレベル | `debug` |
| `DATABASE_URL` | PostgreSQL 接続 URL | `postgresql://crm_user:crm_pass@localhost:5432/crm_db?schema=public` |
| `SHADOW_DATABASE_URL` | Prisma マイグレーションの Shadow DB (任意) | `postgresql://crm_user:crm_pass@localhost:5432/crm_db_shadow?schema=public` |
| `JWT_SECRET` | 認証トークン用シークレット (後続 WS で使用) | `please-change-me` |
| `JWT_EXPIRES_IN` | JWT の有効期限 | `1d` |
| `BCRYPT_SALT_ROUNDS` | パスワードハッシュの cost | `12` |
| `SEED_USER_PASSWORD` | シードユーザーの平文パスワード | `ChangeMe123!` |

Docker Compose では `.env` の値が `api` サービスに渡され、`db` サービスは定義済みの資格情報 (ユーザー/パスワード) を利用する。

## 🗄️ Prisma / Database ワークフロー

1. `docker compose up -d db` で PostgreSQL を起動 (初回は `postgres_data` ボリュームが作成される)。
2. `npm --prefix apps/api run db:migrate` でローカル DB にマイグレーションを適用。
3. `npm --prefix apps/api run db:seed` でサンプルユーザー/アカウント/案件データを投入。
4. Prisma Studio を確認したい場合は `npm --prefix apps/api run db:studio`。

### マイグレーションの生成

- 新しいスキーマを記述したら `npm --prefix apps/api run db:migrate -- --name <migration_name>` を実行し、PostgreSQL が起動していることを確認する。
- DB を起動せずにスクリプトだけ生成したい場合は `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql` を使用できる。

### シードデータ

- `prisma/seed.ts` は Prisma Client を使ってパイプラインステージ、管理者/マネージャーユーザー、代表的なアカウント・案件・活動・タスクを作成する。
- `prisma.config.ts` の設定により `npm --prefix apps/api run db:seed` で `ts-node --project tsconfig.prisma.json prisma/seed.ts` が実行される。
- サンプル認証情報: `admin@crm.local` / `manager@crm.local` （共通パスワードは `SEED_USER_PASSWORD` で上書き可、デフォルトは `ChangeMe123!`）。
- 2025-11-19 以降のシードでは RFC 4122 準拠の UUID (例: `11111111-1111-4111-8111-111111111111`) を割り当てているため、既存 DB に旧 ID が残っている場合は `cd apps/api && npx prisma migrate reset --force` → `npm --prefix apps/api run db:seed` で初期化してから利用する。

### 認証 API エンドポイント

| Method | Path | 説明 |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | 新規ユーザー登録 (email/password/任意の氏名) |
| `POST` | `/api/auth/login` | 既存ユーザーのログイン。JWT を返却 |
| `GET` | `/api/auth/me` | Bearer JWT を用いた現在ユーザー情報取得 |

`Authorization: Bearer <token>` ヘッダーが必要なルートでは、サーバー側でロールを検証した上で `req.user` に `{ id, email, role }` を格納する。

### アカウント / コンタクト API（WS4 範囲）

#### Accounts

| Method | Path | 説明 |
| --- | --- | --- |
| `GET` | `/api/accounts` | クエリ `search`, `status`, `page`, `pageSize` をサポートする一覧取得 |
| `GET` | `/api/accounts/:id` | 単一アカウント詳細 |
| `POST` | `/api/accounts` | 企業情報の作成 (名前必須、その他任意) |
| `PUT` | `/api/accounts/:id` | 企業情報の更新 (部分更新可) |
| `DELETE` | `/api/accounts/:id` | ソフトデリート ( `deletedAt` を設定 ) |

#### Contacts

| Method | Path | 説明 |
| --- | --- | --- |
| `GET` | `/api/contacts` | クエリ `search`, `accountId`, `page`, `pageSize` をサポートする一覧取得 |
| `GET` | `/api/contacts/:id` | 単一コンタクト詳細 (関連アカウント含む) |
| `POST` | `/api/contacts` | アカウント紐付け必須でコンタクト作成 |
| `PUT` | `/api/contacts/:id` | コンパクトな部分更新、アカウント再割当も可 |
| `DELETE` | `/api/contacts/:id` | ソフトデリート |

#### Pipeline Stages

| Method | Path | 説明 |
| --- | --- | --- |
| `GET` | `/api/pipeline-stages` | ステージ一覧 (order 昇順) |
| `POST` | `/api/pipeline-stages` | ステージの新規作成 (name/order/probability 等) |
| `GET` | `/api/pipeline-stages/:id` | 単一ステージ詳細 |
| `PUT` | `/api/pipeline-stages/:id` | ステージの部分更新 (probability/isWon/isLost など) |
| `DELETE` | `/api/pipeline-stages/:id` | 依存する案件がない場合のみ削除 |

#### Opportunities

| Method | Path | 説明 |
| --- | --- | --- |
| `GET` | `/api/opportunities` | クエリ `search`, `status`, `stageId`, `ownerId`, `accountId`, `page`, `pageSize` をサポート |
| `GET` | `/api/opportunities/:id` | 取引詳細 (Account/Owner/Stage/Contact を含む) |
| `POST` | `/api/opportunities` | Account+Owner+Stage を必須として案件作成。Stage から status/probability を推測 |
| `PUT` | `/api/opportunities/:id` | 部分更新 (ステージ変更時は監査ログを記録し、必要なら status/probability を自動更新) |
| `DELETE` | `/api/opportunities/:id` | ソフトデリート。監査ログ `DELETE` を記録 |

ステージ変更時には自動で Activity (type: NOTE) と follow-up Task (3 日後の期限) が作成され、営業担当にリマインダーを通知します。

#### Activities

| Method | Path | 説明 |
| --- | --- | --- |
| `GET` | `/api/activities` | `type`, `userId`, `accountId`, `contactId`, `opportunityId`, `from`, `to`, `page`, `pageSize` によるフィルタ |
| `GET` | `/api/activities/:id` | 活動詳細 (user/account/contact/opportunity を含む) |
| `POST` | `/api/activities` | 必須: `type`, `subject`, `userId`。関連エンティティが存在するか検証 |
| `PUT` | `/api/activities/:id` | 部分更新、関連エンティティ差し替え可 |
| `DELETE` | `/api/activities/:id` | 活動削除 |

#### Tasks

| Method | Path | 説明 |
| --- | --- | --- |
| `GET` | `/api/tasks` | `status`, `ownerId`, `accountId`, `opportunityId`, `activityId`, `dueBefore`, `dueAfter`, `page`, `pageSize` をサポート |
| `GET` | `/api/tasks/:id` | タスク詳細 (owner/account/opportunity/activity/contact) |
| `POST` | `/api/tasks` | タスク作成。owner 必須、関連エンティティ存在チェック、`status` 未指定なら OPEN |
| `PUT` | `/api/tasks/:id` | 部分更新。`status` を COMPLETED にすると `completedAt` を自動で設定 |
| `DELETE` | `/api/tasks/:id` | タスク削除 |

#### Audit Logs

| Method | Path | 説明 |
| --- | --- | --- |
| `GET` | `/api/audit-logs` | `entityType`, `entityId`, `userId`, `opportunityId`, `action`, `from`, `to`, `page`, `pageSize` でフィルタ可能。管理者/マネージャーのみアクセス可 |

#### Reports

| Method | Path | 説明 |
| --- | --- | --- |
| `GET` | `/api/reports/pipeline-stage` | ステージごとの案件数・金額合計。管理者/マネージャー限定 |
| `GET` | `/api/reports/owner` | 担当者ごとのパイプライン合計と件数。管理者/マネージャー限定 |

すべてのビジネス系 API は JWT 認証必須で、一覧応答は `data` と `meta` (ページング情報) を持つ統一フォーマットです。

## 🧪 テスト

```
npm run test
```

`test` スクリプトは ESLint と Jest (ts-jest) を実行します。ユニットテストは `tests/` 以下に TypeScript で配置します。
