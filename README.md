# Full-Featured CRM — Backend & Web (Hono/Cloudflare Prisma D1 + Next.js)

このリポジトリは **Hono + Cloudflare Workers + Prisma D1** をベースにした API と、Next.js 19 (App Router) ベースの Web フロントエンドを含むモノレポ構成です。  
実装・運用は ExecPlan (.agent/execplans/) を唯一のソースオブトゥルースとして進めます。

---

## 🧱 現在のアーキテクチャ

| レイヤー | 技術 |
| --- | --- |
| API | Hono / Cloudflare Workers (Wrangler dev), Node ランタイムは `@hono/node-server` で互換実行 |
| DB | Cloudflare D1 (SQLite 相当) + Prisma ORM (`@prisma/adapter-d1`) |
| Frontend | Next.js 19 + React 19 (App Router) |
| Auth | JWT (RSA ではなく HMAC)、HttpOnly Cookie に保存 |
| テスト | Jest (API unit/e2e)、Playwright (Web e2e) |
| IaC | Wrangler `wrangler.toml`、DB マイグレーションは `sqlite3` で適用 |

---

## 📁 Monorepo 構成

```
crm/
├── apps/
│   ├── api/   # Hono/Workers API
│   └── web/   # Next.js フロント
├── .agent/    # ExecPlan/PLANS (必ず参照)
├── README.md
└── ...
```

---

## ⚙️ セットアップ手順

1. **依存関係インストール**
   ```bash
   npm install
   ```

2. **環境変数**
   - ローカル: `.env` / `apps/web/.env.local`
      | 変数 | 推奨値 |
      | --- | --- |
      | `DATABASE_URL` | `file:/Users/<you>/work/crm/apps/api/prisma/dev.db` |
      | `API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000/api` |
      | `JWT_SECRET` / `JWT_EXPIRES_IN` / `BCRYPT_SALT_ROUNDS` | 任意のローカル値 |
   - Workers (apps/api)
      | 変数 | 例 |
      | --- | --- |
      | `JWT_SECRET` | `wrangler secret put JWT_SECRET` で投入 |
      | `API_BASE_URL` | `https://api.<domain>/api` (`wrangler --var` or `[vars]`) |
      | 他 (`JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`) | Secrets に登録 |
   - Pages (apps/web)
      | 変数 | 例 |
      | --- | --- |
      | `NEXT_PUBLIC_API_BASE_URL` | `https://api.<domain>/api` |
      | `API_BASE_URL` (SSR が必要なら) | `https://api.<domain>/api` |

   - Cloudflare D1 の `database_id` は Git に含めない運用。`apps/api/wrangler.example.toml` を `apps/api/wrangler.toml` にコピーし、自分の `database_id` を記述してください（`.gitignore` 済み）。

3. **DB 初期化 (SQLite)**
   Cloudflare D1 互換の SQLite ファイルに直接マイグレーションを流します。
   ```bash
   cd apps/api
   DB_PATH="$(pwd)/prisma/dev.db"
   rm -f "$DB_PATH"
   sqlite3 "$DB_PATH" < prisma/migrations/20251217075403_init/migration.sql
   env DATABASE_URL="file:${DB_PATH}" \
     npx ts-node --project tsconfig.prisma.json prisma/seed.ts
   ```
   `✅ Prisma seed data created.` が出れば成功。
   > 本番 D1 には `apps/api/d1/migrations/*.sql` を `npx wrangler d1 migrations apply crm-api --remote` で適用し、`prisma/seed.d1.sql` を `wrangler d1 execute` で流してください。手順の詳細は `docs/deployment/cloudflare.md` を参照。

4. **サーバ起動**  
   ※ `file:/.../dev.db` の部分は **自分のリポジトリの絶対パス** に置き換えてください。例: `file:/Users/<you>/work/crm/apps/api/prisma/dev.db`。  
   - Node ランタイム (開発用):  
     ```bash
     DATABASE_URL="file:/Users/<you>/work/crm/apps/api/prisma/dev.db" \
       npm --prefix apps/api run dev   # http://localhost:4000/api/healthz
     ```
     *(ルートで `pwd` が `~/work/crm` なら `DATABASE_URL="file:$(pwd)/apps/api/prisma/dev.db"` )*
   - Cloudflare Workers (Wrangler dev):  
     ```bash
     DATABASE_URL="file:/Users/<you>/work/crm/apps/api/prisma/dev.db" \
       npm --prefix apps/api run cf:dev   # http://localhost:8787/api/healthz
     ```
   - Web:  
     `npm --prefix apps/web run dev` → http://localhost:3000

5. **ユーザー**
   シード済みユーザー: `admin@crm.local` / `ChangeMe123!`、`manager@crm.local` / `ChangeMe123!`  
   `.env` の `SEED_USER_PASSWORD` を変更 → 再シードで反映。

---

## 📜 npm Scripts (代表)

| Script | 説明 |
| --- | --- |
| `npm run dev` | API(Node)+Web を並列起動 |
| `npm --prefix apps/api run dev` | API(Node)のみ |
| `npm --prefix apps/api run cf:dev` | Workers ローカル実行 (Wrangler) |
| `npm --prefix apps/api run lint` | API ESLint |
| `npm --prefix apps/api run test` | lint + unit |
| `npm --prefix apps/api run test:e2e` | Jest E2E (SQLite DB を `sqlite3` + seed で生成) |
| `npm --prefix apps/web run dev` | Web dev server |
| `npm run test:e2e` | Playwright (Web) |

> **注意**: Prisma CLI (migrate reset など) は SQLite + Workers では動かないため、ローカルでは `sqlite3 < migration.sql` で直接適用します。本番 D1 では `wrangler d1 migrations apply` を利用してください。

---

## ✅ 動作確認 TODO

1. `/api/healthz` が 200 を返す (Node/Workers 両方)  
2. `POST /api/auth/login` でシードユーザーがログインできる  
3. `/api/accounts`、`/api/contacts`、`/api/opportunities` 等 CRUD を1本ずつ確認  
4. `npm --prefix apps/api run test` と `npm --prefix apps/api run test:e2e` がグリーン  
5. `apps/web` からログインしダッシュボードや主要 screen をクリック

---

## 🧪 テスト

### API (Jest)
- **Unit**:  
  ```bash
  DATABASE_URL_TEST="file:/Users/<you>/work/crm/apps/api/prisma/test.db" \
    npm --prefix apps/api run test
  ```
- **E2E**:  
  ```bash
  DATABASE_URL_TEST="file:/Users/<you>/work/crm/apps/api/prisma/test.db" \
    npm --prefix apps/api run test:e2e
  ```
  - GlobalSetup が `sqlite3` + migration SQL + seed で DB を再生成
  - `DATABASE_URL_TEST` は必ず絶対パスで指定

### Web (Playwright)
- `npm run test:e2e` ※ `PLAYWRIGHT_BASE_URL` (デフォルト http://localhost:3000) を `.env` で管理
- 失敗時は `test-results/` のスクショ/動画/trace を確認

---

## 🗂️ ExecPlan / ドキュメント

- `.agent/execplans/api_hono_migration.md` — Hono/D1 以降の計画と進捗ログ
- `.agent/PLANS.md` — ExecPlan のルール
- `docs/deployment/cloudflare.md` — Cloudflare 無料枠でのデプロイ手順
- `docs/` 配下の他ガイド — 補足資料（テスト手順など）

作業時は必ず ExecPlan を更新し、`Progress` / `Surprises` / `Decision Log` / `Outcomes` を最新に保ちます。

---

## 🤝 コントリビュート時の注意

1. `git status` で不要ファイル (例: `apps/api/apps/...`) が出ていないか確認
2. 環境固有ファイル/DB (`*.db`, `.wrangler/`) は `.gitignore` に含める
3. CI と同じコマンド (`npm --prefix apps/api run test`, `npm --prefix apps/api run test:e2e`, `npm run test:e2e`) をローカルで通してから PR
4. Cloudflare Secrets/Bindings は PR に含めない (`wrangler secret put ...` / Dashbord 上で設定)

これで Cloudflare Workers (Hono) + D1 + Next.js の最新構成が README に反映されています。必要な手順・注意点を追加したい場合はこのファイルを更新してください。
