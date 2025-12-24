# Cloudflare 無料デプロイ手順

Hono + Cloudflare Workers + D1 + Next.js を、すべて Cloudflare の無料枠で動かすための手順です。  
API（apps/api）は Workers、Web（apps/web）は Cloudflare Pages、DB は D1 を利用します。

---

## 0. 前提

- Cloudflare アカウント（無料プランで可）
- ローカルで `npm install` 済み、`.env` / `apps/web/.env.local` をセット
- Node 20 以上、Wrangler CLI (`npm install -g wrangler` または `npx wrangler ...`)
- GitHub 等リポジトリを Cloudflare Pages から参照できる状態

補足: DB は SQLite ファイルをローカルで作り、Cloudflare では D1 に移す構成です。Docker Compose 等は不要です。

---

## 1. D1 データベースの作成

```bash
cd apps/api
npx wrangler login
npx wrangler d1 create crm-api
```

作成時に表示される `uuid`（= database_id）をメモし、リポジトリに含まれない `apps/api/wrangler.toml` へ記述します。

```bash
cd apps/api
cp wrangler.example.toml wrangler.toml
# ファイルを開き、database_id を自分の値に書き換え
```

> `database_id` を忘れた場合は `npx wrangler d1 list` や `npx wrangler d1 info crm-api`、または Cloudflare ダッシュボード（Workers & Pages → D1 → 対象 DB）で再確認できます。

ローカル開発用に `wrangler d1 migrations apply crm-api --local` を一度実行すると、`.wrangler/` 配下にエミュレーション DB が作られます。

---

## 2. スキーマ適用と初期データ投入

### スキーマ（マイグレーション）

`apps/api/wrangler.toml` では `migrations_dir = "d1/migrations"` を指定済みです。  
`apps/api/d1/migrations/` の `0001_init.sql` など D1 用 SQL を更新したうえで以下を実行します。

```bash
cd apps/api
npx wrangler d1 migrations apply crm-api --remote
# ローカル確認したい場合は --local
```

### サンプルデータ

`apps/api/prisma/seed.d1.sql` に、`admin@crm.local` / `manager@crm.local` などの初期データを SQL で用意しています。

```bash
cd apps/api
npx wrangler d1 execute crm-api --remote --file prisma/seed.d1.sql
```

> Cloudflare D1 (remote) は `BEGIN TRANSACTION` を含むスクリプトを受け付けないため、`seed.d1.sql` では単一ステートメントを順番に流す構成にしています。自作スクリプトも同様にトランザクション句を入れないでください。

パスワードを変えたい場合は SQL 内の `passwordHash` を書き換えるか、別途 API でユーザー作成してください。

---

## 3. 環境変数・Secrets

Workers（API）は `wrangler secrets`、Pages（Web）はプロジェクト設定の Environment variables に設定します。

| 変数 | API (Worker) | Web (Pages) | 備考 |
| --- | --- | --- | --- |
| `JWT_SECRET` | ✅ `npx wrangler secret put JWT_SECRET` | ❌ | 任意の 32+ 文字 |
| `BCRYPT_SALT_ROUNDS` | ✅（12 推奨） | ❌ | 変更しない場合は既定 12 |
| `API_BASE_URL` | ✅ | ✅ | Pages から API を叩く URL (`https://api.example.com/api`) |
| `NEXT_PUBLIC_API_BASE_URL` | ✅(Workers dev の場合) | ✅ | フロントエンド fetch 用 |
| `NEXT_PUBLIC_ENABLE_FULL_REPORTS` | ⚠️（ローカルのみ推奨） | ✅ | `false` を推奨。`true` にするとレポート画面がフル機能になるが、Cloudflare Pages では 25 MiB 制限を超える恐れあり |
| `PLAYWRIGHT_*` | オプション | 📄 `.env` 参照 | CI 用 |

`DATABASE_URL` はローカル専用（`file:/abs/path/.../dev.db`）。Workers では D1 バインディング (`env.DB`) を使うため不要です。

---

## 4. API (Workers) デプロイ

```bash
cd apps/api
npm install  # 初回のみ
npm run build
npm run cf:deploy
```

デプロイ後、Cloudflare ダッシュボード → Workers & Pages → 該当 Worker → Settings から  
Route を追加（例: `api.example.com/*`）すればカスタムドメインで公開できます。

ローカル確認は `DATABASE_URL="file:/Users/<you>/work/crm/apps/api/prisma/dev.db" npm run cf:dev`。  
（`wrangler.toml` が gitignore されているため、他メンバーは `wrangler.example.toml` をコピーして自分の ID を記入します）

---

## 5. Web (Cloudflare Pages) デプロイ

1. Cloudflare Pages で新規プロジェクト → 「Connect to Git」→ リポジトリ選択
2. Build settings  
   - Framework preset: `Next.js`
   - Root Dir: `apps/web`
   - Build command: `npm install && npm run build:cf-pages`
   - Build output: `.vercel/output` （UI が自動で先頭に `/` を付けるが、`apps/web/.vercel/output` が参照される）
   - `npm run build:cf-pages` は内部で `NEXT_ON_PAGES_PROJECT_DIR=. npx @cloudflare/next-on-pages@1` を実行し、`.vercel/output` を生成します。Cloudflare Pages 環境でも常にカレントディレクトリを `apps/web` に固定したまま Next.js アダプタを走らせるための設定です。
   - Next.js の App Router は edge runtime 前提（`apps/web/src/app/layout.tsx` で `export const runtime = 'edge';` を指定済み）。Cloudflare の Next アダプタは Node.js runtime をサポートしていないため、サーバーアクションを edge 対応にして API 経由でデータを取得しています。
   - モノレポ配下で Next.js プロジェクトを検出させるため、`apps/web/apps/web -> ..` というシンボリックリンクを配置しています（`apps/web/apps/web/.next` を参照しても実体は `apps/web/.next` ）。削除しないよう注意してください。
3. Environment variables  
   - `NODE_VERSION=20`
   - `NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api`
   - `API_BASE_URL` が必要なら同値で設定（SSR fetch 用）
   - `NEXT_PUBLIC_ENABLE_FULL_REPORTS=false`（Lite モードが既定。`true` にすると Next.js Edge Worker が 25 MiB を超えるため Cloudflare では非推奨）
4. Deploy を実行

> Reports 画面は Lite モードを既定としています。どうしても Cloudflare Pages 上でフル機能を有効にしたい場合は `NEXT_PUBLIC_ENABLE_FULL_REPORTS=true` で再ビルドしてください（Worker サイズが 25 MiB を超えるとデプロイ失敗する点に注意）。

Preview で問題なければ Custom domain から `www.example.com` などを割り当てます。

---

## 6. 独自ドメインの割り当て

1. Cloudflare DNS に独自ドメインを追加（`example.com`）
2. Pages: `www.example.com` などを Custom domain に設定 → 自動で CNAME が追加
3. Workers(API): `api.example.com` 用の Route を追加し、DNS A/AAAA は自動管理（`proxied` のまま）
4. HTTPS 証明書は Cloudflare が自動発行。反映まで数分待機。

---

## 7. 動作確認フロー

1. `curl https://api.example.com/api/healthz`
2. `POST https://api.example.com/api/auth/login` に `admin@crm.local` / `ChangeMe123!`
3. Pages からログイン → 一覧/作成ドロワーの操作
4. `wrangler d1 execute crm-api --remote --command "SELECT COUNT(*) FROM \\"User\\";"` で DB を確認

---

## 8. コストと運用 Tips

- Workers: 10 万リクエスト/月まで無料。ログ量が多い場合は `LOG_LEVEL` を上げすぎない。
- D1: ストレージ 100MB 無料。超えると自動で Standard プラン（$5）へ。不要データは `DELETE` + `VACUUM`.
- Pages: ビルド 100 回/日、帯域無制限。Preview を乱発しすぎない。
- 定期バックアップ: `npx wrangler d1 export crm-api --remote > backup.sql`
- ログインできない場合は **API / Web の `NEXT_PUBLIC_API_BASE_URL` が一致しているか**、**シード SQL を流したか** を再確認。

これでポートフォリオ用途の無料デプロイ環境が整います。運用フローを変更した際はこのドキュメントと README を更新してください。
