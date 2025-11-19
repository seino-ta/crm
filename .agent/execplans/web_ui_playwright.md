# ExecPlan: CRM Web UI + Playwright Verification

## メタ情報
- バージョン: v1.0 (2025-11-18 作成)
- 作成者: Codex エージェント
- 参照ソース: AGENTS.md / README.md / crm_mvp ExecPlan / ユーザー要件

## 背景と目的
- 既存の Express/Prisma API (現行リポジトリ) は CRUD やワークフローを備えているが、UI が未整備。
- 目標は Next.js (TypeScript) で `apps/web` を構築し、バックエンド API (`apps/api`) を同一リポジトリ内に配置した monorepo を確立すること。
- UI 実装は Playwright を活用してブラウザ挙動を確認しながら進め、主要 CRM ワークフロー (認証/アカウント/案件/活動/タスク/レポート) を操作可能にする。

## ゴール
1. `apps/web` に Next.js + TypeScript + App Router 構成を用意し、API エンドポイントを .env で切り替えられるようにする。
2. 既存バックエンドを `apps/api` 配下へ整理し、ルートに共通の ESLint/Prettier/TS 設定を置いて monorepo 管理に移行。
3. ログイン、アカウント一覧/詳細 + CRUD、案件一覧/詳細 + ステージ更新、活動/タスク一覧 +作成/完了、レポート画面を UI で実装する。
4. Playwright による e2e テスト + `npx playwright codegen` 手順を README に明記し、主要画面のスクリーンショット生成コマンドを共有する。
5. ルート npm scripts (`lint`, `test`, `dev`, `build`) を monorepo 対応に更新し、CI (GitHub Actions) でフロント/バック双方の lint/test を実行する。

## 非ゴール
- モバイル固有 UI、アクセシビリティ AA 準拠の完了 (ベース構造の提供のみ)。
- サーバーサイドレンダリング最適化や高度なキャッシュ/edge 配信。
- 高度な Playwright Visual Regression。今回は基本的なフロー確認とスクリーンショット取得を重視。

## 成果物
- `apps/web` (Next.js App Router, React Server Components + Client Componentsのハイブリッド構成)。
- `apps/api` ディレクトリへ再配置された Express/Prisma コード + ビルド成果。
- 共通設定: `tsconfig.base.json`, `eslint.config.cjs`, `prettier` 設定更新。
- Frontend 向け UI コンポーネント・hooks・型定義 (`apps/web/src/lib/api.ts`, `types/crm.ts` 等)。
- Playwright 設定 (`playwright.config.ts`, `apps/web/tests/e2e/*`).
- README 追記: Playwright を用いた確認手順、スクリーンショット保存先、主要画面ガイド。
- `.env.example` へのフロントエンド用環境変数追加 (API base URL, Next Auth Secrets など)。
- CI 定義 (例: `.github/workflows/ci.yml`) を lint/test 実行へ拡張。

## 制約・前提
- Node.js 20+ / npm 10+ (既存 API と共通)。
- Next.js 15 (最新 stable) + App Router、UI Framework は自前 (軽量な UI キット + Tailwind or CSS Modules)。
- 認証: 既存 API の `/api/auth/login` を用い、Next.js ではクレデンシャルフォーム + Token ストア (HttpOnly cookie or next/headers cookies) を採用。
- API 呼び出しは fetch。SSR と CSR の組み合わせで UX 確保。
- Playwright: Chromium+Firefox を headless で実行、スクリーンショットは `apps/web/tests/e2e/screenshots` に保存。

## 主要画面 & 要件
1. **ログイン**: Email/Password, 成功時に JWT を secure cookie 保存, 失敗時にエラー表示。
2. **ダッシュボード / レポート**: 案件ステージ別集計、担当者別パイプライン合計を charts/カードで表示。
3. **アカウント一覧/詳細**: テーブル・検索フォーム、詳細ページで関連コンタクト・案件抜粋、CRUD モーダル。
4. **案件一覧/詳細**: ステージバッジ、Kanban 風 & テーブル View、詳細ページでタイムライン表示。
5. **活動/タスク**: 活動ログ + タスク一覧/フィルタ、作成フォーム、タスク完了トグル。
6. **グローバルナビ**: Sidebar + ヘッダー (ユーザー情報、ログアウト)。

## 実装ストリーム
### WS1: Monorepo リストラクチャ & 基盤
- 既存ソースを `apps/api` へ移動し、パス更新 (tsconfig, package scripts, Dockerfile, jest paths)。
- ルート `package.json` を npm workspaces (apps/api, apps/web) 化。共有 devDependencies をルート化し、各 app は個別 package.json。
- `tsconfig.base.json` + 各アプリ固有 tsconfig を作成。ESLint/Prettier 設定を共有参照に更新。
- `.env.example`/`.env` に `API_BASE_URL`, `WEB_PORT`, `NEXT_PUBLIC_API_BASE_URL` などを追加。`apps/web/.env.local` テンプレを記載。

### WS2: Next.js アプリひな形 + 認証
- `apps/web` で `create-next-app --ts --eslint --src-dir --app` を実行し、不要ファイルを削除。
- Tailwind or custom UI tokens を設定 (decide: Tailwind minimal)。
- API クライアント (`lib/apiClient.ts`) と型 (`lib/types.ts`) を作成し、JWT を cookie/session storage へ保存する hook (`useAuth`) を用意。
- Middleware or server actions で認証保護。`/login` ページ + `ProtectedLayout` で認証ガード。

### WS3: CRM セクション UI
- **Accounts**: 一覧 (サーバーサイド fetch + pagination controls), 詳細ページ, 作成/編集モーダル, 削除 (ソフト) アクション。
- **Opportunities**: ステージ別ボード + テーブル, 詳細 view (stage change, probability slider)。
- **Activities/Tasks**: Combined timeline, create/edit forms, task completion toggles。
- **Reports**: Stage totals, owner totals charts (use recharts or chart.js)。
- 各ページ API hooks, error/loading states, optimistic updates where feasible。

### WS4: Playwright + UI 検証フロー
- `npx playwright install` を実行し、`playwright.config.ts` を monorepo ルートに配置。
- e2e テスト: 認証 → アカウント CRUD → 案件ステージ更新 → 活動作成 → タスク完了 → レポート表示のハッピーパス。
- `tests/e2e/screenshots/*.png` 生成ユーティリティを作り README に反映。`npm run ui:snapshots` で Playwright screenshot。
- README に「npx playwright codegen http://localhost:3000」「npx playwright show-report」などの手順と Playwright 用 npm script を追記。

### WS5: CI & DX 整備
- ルート `package.json` scripts: `dev`=concurrently api/web, `test`=lint+unit+playwright, `lint`=eslint both, `build`=turbo or npm-run-all sequential。
- GitHub Actions `ci.yml`: setup Node, install deps, run lint/test/build, optionally upload Playwright report。
- README に monorepo 起動方法、Playwright スクリプト、UI 構成図を追記。

## バリデーション / 受け入れ基準
- `npm run dev` が API(4000) + Web(3000) を同時起動し、ブラウザで全ページが操作可能。
- `.env.example` をコピーし `.env` + `apps/web/.env.local` を準備すると、API/Web 双方が設定される。
- `npm run lint` が `apps/api` と `apps/web` の TypeScript/React コードに対して成功し、`npm run test` が Jest + Playwright を通過する。
- Playwright テストが主要 CRM フローを自動化し、スクリーンショットが生成される。
- README に UI 確認/スクリーンショット/Playwright codegen の手順が記載されている。

## 進捗トラッキング
- 2025-11-18: ExecPlan v1.0 作成。
- 2025-11-19: WS1 完了 — `apps/api` への再配置、workspaces 化、共通 tsconfig/eslint/.env 拡張、`docker-compose.yml`/スクリプト更新。
- 2025-11-19: WS2 完了 — `apps/web` を Next.js 15 + App Router で初期化し、AppShell/Middleware/Server Actions ベースの認証フローと UI コンポーネント群を構築。
- 2025-11-19: WS3 進行中 — ダッシュボード/アカウント/案件/活動/タスク/レポート画面と CRUD/ステージ更新/タスク完了フローを SSR+Client 組み合わせで実装（残り: 細部の UX 調整と README 反映）。
- (予定) WS4 完了: Playwright e2e & スクショ。
- (予定) WS5 完了: CI 反映。

## Surprises & Discoveries
- 2025-11-19: Next.js 16 の `next lint` コマンドが提供されず `next <dir>` 解釈になり lint が失敗。`apps/web` 側で直接 ESLint CLI (`eslint . --ext .ts,.tsx`) を使うワークアラウンドに変更。

## Decision Log
- 2025-11-18: Next.js 15 App Router + TypeScript を採用。
- 2025-11-18: UI フレームワークは Tailwind CSS をベースに、CRM 用 UI コンポーネントを自作。
- 2025-11-18: 認証トークンは HttpOnly Cookie + Next.js Server Actions で扱い、Playwright テストは seeded admin 資格情報を利用。
- 2025-11-19: Monorepo の npm scripts は `npm --prefix <app>` 形式に揃え、`lint`/`test`/`dev`/`build` を並列実行できるよう `npm-run-all` を採用。
- 2025-11-19: `apps/web` の lint は Next.js CLI ではなく ESLint CLI を直接使用し、`tsconfig.base.json` + Flat Config をルート共有とする。

## Outcomes & Retrospective
- (未記入)
