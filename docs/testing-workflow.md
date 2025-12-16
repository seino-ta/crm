# テスト実行ガイド（バックエンド / フロントエンド共通手順）

## 目的
- セッションを跨いでも、機能追加・仕様変更時に必ずバックエンドAPI E2EとフロントエンドPlaywright E2Eを実行・確認するための最小手順を明文化する。

## 前提
- .env / .env.test / apps/web/.env.local が整備済み
- Dockerが使えること
- Node 20+ / npm 10+

## バックエンド API E2E
1. テストDB起動: `npm run db:test:up`
2. 実行: `npm --prefix apps/api run test:e2e`
3. 後片付け: `npm run db:test:down`
   - globalSetupで毎回 `migrate reset` → `deploy` → `seed` を行うため、前回の状態を気にせず再実行できる。

## フロントエンド Playwright E2E
1. 依存取得: `npm install`（初回のみ）
2. API + Web を別ターミナルで起動  
   - API: `npm --prefix apps/api run dev` または `npm run dev`（並列）
   - Web: `npm --prefix apps/web run dev`
3. Playwright実行: `npm --prefix apps/web run test:e2e`
   - 画面差分チェックは `npm --prefix apps/web run ui:snapshots`

## 新機能・仕様変更時のチェックリスト
- [ ] API側で影響するエンドポイントがある → `npm --prefix apps/api run test:e2e`
- [ ] UIで表示/操作が変わる → `npm --prefix apps/web run test:e2e`
- [ ] DBスキーマを変更した → API E2E必須（migrate/seed動作確認）
- [ ] 認証まわりを触った → API E2E + Playwright両方実行
- [ ] フロント/API双方に跨る変更 → 両方必ず実行

## CI 連携（メモ）
- 現状ローカル実行前提。CIへ組み込む場合は以下をジョブに追加する:
  - API: `npm run db:test:up && npm --prefix apps/api run test:e2e`
  - Web: `npm --prefix apps/web run test:e2e`
