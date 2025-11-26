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
- 2025-11-19: ログイン後にリダイレクトできない回帰を修正 (Server Action の `redirect` 例外を適切に再スローし、`apiFetch` の `skipAuth` 向け 401 ハンドリングを調整) し、README と `.env.local.example` を更新。
- 2025-11-19: Server Action で CRUD 後に `redirect()` を行うよう Accounts/Opportunities/Activities/Tasks を更新し、Playwright 主要シナリオ (ログイン→各メニュー CRUD) が通ることを確認。
- 2025-11-19: Prisma seed の固定 ID を RFC 4122 準拠の UUID に差し替え、DB リセット (`npx prisma migrate reset` → `npm --prefix apps/api run db:seed`) 手順を README に追記。
- 2025-11-25: WS3 バグ修正 — Account 詳細フォーム保存後に Next.js が同一パスへ `router.replace` を繰り返して無限リロードになる回帰を特定し、成功ステートの重複処理を防ぎつつ同一パスの場合は `router.refresh` に切り替えて解消。
- 2025-11-25: WS3 バグ修正 — Account 詳細フォーム保存後に Next.js が同一パスへ `router.replace` を繰り返して無限リロードになる回帰を特定し、成功ステートの重複処理を防ぎつつ同一パスの場合は `router.refresh` に切り替えて解消。
- 2025-11-25: WS3 バグ修正 — ステータス変更など `router.refresh` を即時呼ぶフォームで SuccessToast が出ない問題を切り分け、トリガーをラッチして `requestAnimationFrame` 依存を排除し、即座にリフレッシュしてもトーストが表示されるよう改善。
- 2025-11-25: WS3 バグ修正 — それでも `router.refresh` による再フェッチでトースト DOM 自体がアンマウントされる根本原因を特定し、`ToastProvider` + グローバルキューを実装してステータス更新・ステージ変更後もトーストが確実に表示されるようにした。
- (予定) WS4 完了: Playwright e2e & スクショ。
- (予定) WS5 完了: CI 反映。

## Surprises & Discoveries
- 2025-11-19: Next.js 16 の `next lint` コマンドが提供されず `next <dir>` 解釈になり lint が失敗。`apps/web` 側で直接 ESLint CLI (`eslint . --ext .ts,.tsx`) を使うワークアラウンドに変更。
- 2025-11-19: `loginAction` の try/catch が `redirect()` (内部的には `NEXT_REDIRECT` 例外) を飲み込んでしまい、ログイン成功時もエラーメッセージになることを確認。`isRedirectError` で検出して再スローする必要がある。
- 2025-11-19: API 側の Zod `uuid()` が RFC 4122 のバージョン/variant を厳密に検証するため、旧シード ID (`0000...`) では CRUD が 422 になる問題が判明。シード ID を v4 準拠に変更し、既存 DB は migrate reset → seed で更新する方針に統一。
- 2025-11-25: `useActionState` の結果が再マウント後も保持されるため、同一路径への `router.replace` がループを引き起こすことを確認。成功レスポンスごとに一度だけ処理するガードと同一路径判定が必要。
- 2025-11-25: `router.refresh` を即時呼ぶと `SuccessToast` の `requestAnimationFrame` による表示がキャンセルされ、トーストが描画されないことを突き止め。SSR でも安全な isomorphic layout effect + パルス値でトリガーを検知する仕組みへ移行する必要がある。
- 2025-11-25: Server Action 成功後にページ全体が更新されるとトーストコンポーネント自体が外れることを確認。UI フィードバックはルートレベルで管理する必要があり、グローバルトーストストアを用意しないと UX が担保できない。

## Decision Log
- 2025-11-18: Next.js 15 App Router + TypeScript を採用。
- 2025-11-18: UI フレームワークは Tailwind CSS をベースに、CRM 用 UI コンポーネントを自作。
- 2025-11-18: 認証トークンは HttpOnly Cookie + Next.js Server Actions で扱い、Playwright テストは seeded admin 資格情報を利用。
- 2025-11-19: Monorepo の npm scripts は `npm --prefix <app>` 形式に揃え、`lint`/`test`/`dev`/`build` を並列実行できるよう `npm-run-all` を採用。
- 2025-11-19: `apps/web` の lint は Next.js CLI ではなく ESLint CLI を直接使用し、`tsconfig.base.json` + Flat Config をルート共有とする。
- 2025-11-19: `apiFetch` では `skipAuth` オプション使用時に 401 応答で即リダイレクトせず `ApiError` を投げ、フォームでバリデーションエラー表示ができるようにする。
- 2025-11-19: Accounts/Opportunities/Activities/Tasks の作成 Server Action は成功時に `redirect()` で該当ページをリフレッシュし、Playwright でも CRUD 反映を即確認できるようにする。
- 2025-11-19: シード ID を RFC 4122 準拠に更新し、DB リセット時は `npx prisma migrate reset --force` → `npm --prefix apps/api run db:seed` を案内する。
- 2025-11-25: Account フォームの成功ハンドリングは `usePathname` と成功ステートの参照比較で一度だけ発火させ、同一路径では `router.refresh`、異なる遷移のみ `router.replace` を用いると定義。
- 2025-11-25: SuccessToast は requestAnimationFrame を廃し、isomorphic layout effect で trigger を一度だけラッチ → パルスを増分し、どの再描画順でもトースト表示が保証される実装を採用。
- 2025-11-25: トーストは `ToastProvider` に集約し、`SuccessToast`・`useSuccessToast` はコンテキスト経由でグローバルキューへ委譲する方針に変更。ページリフレッシュを跨いでもフィードバックを維持できる。

## Outcomes & Retrospective
- (未記入)
