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
2. `npm run db:migrate` でローカル DB にマイグレーションを適用。
3. `npm run db:seed` でサンプルユーザー/アカウント/案件データを投入。
4. Prisma Studio を確認したい場合は `npm run db:studio`。

### マイグレーションの生成

- 新しいスキーマを記述したら `npm run db:migrate -- --name <migration_name>` を実行し、PostgreSQL が起動していることを確認する。
- DB を起動せずにスクリプトだけ生成したい場合は `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql` を使用できる。

### シードデータ

- `prisma/seed.ts` は Prisma Client を使ってパイプラインステージ、管理者/マネージャーユーザー、代表的なアカウント・案件・活動・タスクを作成する。
- `prisma.config.ts` の設定により `npm run db:seed` で `ts-node --project tsconfig.prisma.json prisma/seed.ts` が実行される。
- サンプル認証情報: `admin@crm.local` / `manager@crm.local` （共通パスワードは `SEED_USER_PASSWORD` で上書き可、デフォルトは `ChangeMe123!`）。

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

両エンドポイントとも JWT 認証必須で、レスポンスは `data`+`meta` (一覧時) を含む統一フォーマット。
