# ExecPlan: ユーザー管理機能（Admin UI + API）

## メタ情報
- バージョン: v0.1 (2025-11-29 作成)
- オーナー: Codex エージェント
- 参照: AGENTS.md / PLANS.md / contacts_crud ExecPlan

## 背景
- 現状 CRM ではログイン・認証は存在するものの、ユーザーを一覧/追加/編集する UI や API が無い。
- Seed された admin/manager アカウントのみで運用しており、メンバーのロール変更や無効化もできない。
- 管理者が自力でユーザーを招待/管理できるようにし、運用コストとセキュリティを向上させたい。

## ゴール
1. 管理者だけがアクセスできる「ユーザー管理」画面（一覧 + 招待 + 編集）を `/admin/users` に実装する。
2. API 側でユーザー一覧/作成/更新/無効化を提供し、ロール（ADMIN/MANAGER/REP）とアクティブ状態を管理できるようにする。
3. 監査ログへユーザー作成/更新/無効化イベントを記録し、Audit Logs で追跡可能にする。

## 非ゴール
- SSO やパスワードリセット、2FA など高度な認証フローの実装。
- 権限モデルの再設計（既存の ADMIN/MANAGER/REP ロールを前提とする）。
- 大規模な通知・メール招待システム（今回はテンポラリパスワード発行と画面表示のみ）。

## ワークストリーム
### WS1: API / データ層
- `users` テーブルに `isActive` / `invitedAt` / `lastLoginAt` など必要カラムを追加（既存 schema で不足分を確認）。
- `/users` REST エンドポイント（GET/POST/PUT/PATCH）を `apps/api/src/routes/users.ts` として追加。
- バリデーション（Zod）やサービス層を実装し、ADMIN 以外からのアクセスは 403 にする。
- 監査ログヘルパーで `entityType = User` を記録。

### WS2: Admin Web UI
- サイドバーの Admin セクションに「Users」リンクを追加し、ADMIN のみ閲覧。
- `/admin/users` ページで以下を実装:
  - 検索・ロールフィルタ付き一覧（名前/メール/ロール/ステータス/最終ログイン）。
  - 新規招待フォーム（メール・氏名・ロール・一時パスワード自動生成）。
  - 行メニューからロール変更/有効・無効切り替え。
  - 成功/エラーのトースト表示、再検証 (`revalidatePath`).
- 共通 UI コンポーネント（モーダル、Confirm ボタン等）を整備。

### WS3: 監査ログ & テスト
- ユーザー CRUD 操作ごとに `AuditAction.CREATE/UPDATE/DELETE` を記録し、既存 Audit Logs 画面で確認。
- Playwright に `admin-users.spec.ts` を追加し、以下を自動化:
  - 管理者でログイン → ユーザー招待 → ロール変更 → 無効化。
  - 一覧と監査ログに反映されることを確認。
- README にユーザー管理の手順/権限制御を追記。

## リスク / 留意事項
- 初期パスワードをどのように伝えるか（画面表示 + copy to clipboard など）。
- 既存 Seed ユーザーで ADMIN 以外がアクセスすると 403 になることを確認。
- 多数のユーザーが存在する場合のパフォーマンス（サーバーページネーション）を考慮。

## 次ステップ
1. WS1: Prisma schema と `/users` API 追加 → マイグレーション作成。
2. WS2: `/admin/users` ページ作成、UI/Server Actions 実装。
3. WS3: Playwright `admin-users.spec.ts` と README 更新。

## Progress
- [ ] WS1: API / Prisma 拡張
- [ ] WS2: Admin Web UI
- [ ] WS3: 監査ログ & テスト

## Surprises & Discoveries
- (未記入)

## Decision Log
- (未記入)

## Outcomes & Retrospective
- (未記入)
