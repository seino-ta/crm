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
| `JWT_SECRET` | 認証トークン用シークレット (後続 WS で使用) | `please-change-me` |

Docker Compose では `.env` の値が `api` サービスに渡され、`db` サービスは定義済みの資格情報 (ユーザー/パスワード) を利用する。
