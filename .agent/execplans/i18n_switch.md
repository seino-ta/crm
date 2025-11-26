# ExecPlan: i18n 切り替え対応

## メタ情報
- バージョン: v0.1 (2025-11-21 作成)
- オーナー: Codex エージェント
- 目的: UI を日本語/英語の切り替えに対応させ、方向性として Next.js の app router での i18n ベストプラクティスを採用する。

## ゴール
1. ルートで言語 (ja/en) を切り替えられる仕組みを整備 (例: `/ja/...`, `/en/...` または cookie ベース)。
2. UI 文言を i18n リソースファイルに切り出し、主要画面 (ログイン〜ダッシュボード/アカウント/案件/活動/タスク/レポート) の文言を両言語に対応。
3. 言語切り替え UI をナビゲーションに実装し、選択状態を cookie/localStorage で保持。
4. Playwright テストを言語固定 (ja) に調整しつつ、README に切り替え方法を記載。

## アプローチ
- **WS1: Next.js i18n 基盤**
  - next-intl または Next.js 16 の `unstable_setRequestLocale` を利用し、ルートセグメント (例: `/[locale]/...`) を導入。
  - Middleware で Accept-Language or cookie を解析し、デフォルトロケールを決定。
- **WS2: 辞書整備**
  - `apps/web/src/locales/{ja,en}` に JSON/TS 辞書を配置し、 `useTranslations` フックで参照。
  - コンポーネントごとに key を付与し、既存の日本語文言を辞書に移行。
- **WS3: UI 実装**
  - Sidebar/TopBar に切り替えスイッチを追加。切り替え時は router.replace で locale 付 URI へ遷移。
  - Form エラーメッセージやトースト文言も i18n 化。
- **WS4: QA/Docs**
  - Playwright を ja 固定で実行 (locale cookie を事前設定) し、主要フローが動くのを確認。
  - README に言語切り替え手順と設定方法を追記。

## Progress
- [x] WS1 基盤 — cookie ベースのロケール検出と `I18nProvider` を実装済み、切り替え UI もサイドバー/TopBar に配置。
- [~] WS2 辞書 — 共通 UI/アカウント/案件/活動ログの文言を辞書化済み。タスク/レポート/監査ログの移行が未完。
- [~] WS3 UI — 言語スイッチと主要フォームの toasts/ボタンを i18n 対応。Playwright 設定・README 更新、ならびにタスク/レポート UI の反映はこれから。
- [ ] WS4 QA/Docs — 最終的な E2E・README 追加は未着手。

## Surprises & Decisions
- Next.js 16 の `cookies()` が Server Components と Edge で挙動差があるため、`setLocaleAction` は cookie store の `set` 実装をバインドして失敗時にフォールバック例外を投げる方針にした。
- サーバーアクションからはロケール文字列を直接返さず、クライアント側で翻訳キーを解決する設計へ切り替え始めた（活動ログから順次適用）。
