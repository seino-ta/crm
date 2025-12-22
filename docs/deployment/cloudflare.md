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

コマンド出力に表示される `database_id` を `apps/api/wrangler.toml` の `[[d1_databases]].database_id` に反映します。

ローカル開発用に `wrangler d1 migrations apply crm-api --local` を一度実行すると、`.wrangler/` 配下にエミュレーション DB が作られます。

---

## 2. スキーマ適用と初期データ投入

### スキーマ（マイグレーション）

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

---

## 5. Web (Cloudflare Pages) デプロイ

1. Cloudflare Pages で新規プロジェクト → 「Connect to Git」→ リポジトリ選択
2. Build settings  
   - Build command: `npm install && npm run build`
   - Build output: `apps/web/.next`
   - Root Dir: （空、もしくは `/`）
3. Environmental variables  
   - `NODE_VERSION=20`
   - `NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api`
   - `API_BASE_URL` が必要なら同値で設定（SSR fetch 用）
4. Deploy を実行

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
