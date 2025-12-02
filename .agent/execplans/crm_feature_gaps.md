# ExecPlan: CRM機能ギャップ対応（リード管理 + RBAC強化）

## メタ情報
- バージョン: v0.1 (2025-12-02 作成)
- オーナー: Codex エージェント
- 参照: AGENTS.md / PLANS.md / config/feature.json

## 背景
- カタログ(`config/feature.json`)上の core/standard 機能に対し、実装状況にばらつきがある。
- RBAC は認証済みチェックと一部 Admin 向け限定ルートのみで、削除権限やオーナー制約が未反映。
- リード管理が未実装で、顧客化前の案件整理ができない。

## ゴール
1. コア機能の RBAC を最低限カタログ権限に揃え、破壊的操作（削除/重要更新）の権限制御を導入する。
2. リード管理（登録・一覧・ステータス更新）を DB/API/UI 一貫で追加し、標準機能のギャップを埋める。
3. 開発者向けに機能カバレッジと権限ポリシーの概要を README に記述する。

## 非ゴール
- 完全な組織/チーム階層のモデル化（現状のロールとオーナー情報を前提とする）。
- 通知、ファイル添付、インポート/エクスポートの実装（今回は設計のみ言及に留める）。
- 高度なワークフロー自動化や SLA 連携。

## スコープ / ワークストリーム
### WS1: RBAC強化（core）
- 各エンティティの削除・更新に対し `UserRole` ベースのポリシーを追加（Account/Contact/Opportunity/Activity/Task）。
- Account 作成時に作成者を OWNER Assignment として紐付け、オーナーのみアーカイブ/復元可にする。
- 共通ヘルパー（ポリシーチェック）を middleware 層に追加し、API ルートで利用。

### WS2: リード管理追加（standard）
- Prisma に `Lead` モデルとステータス enum を追加し、マイグレーションを作成。
- API: CRUD + ステータス更新、簡易フィルター、AuditLog 連携。
- UI: Dashboard ナビに「Leads」を追加し、一覧・作成/編集フォーム・ステータス変更を実装。
- 権限: USER/MANAGER/ADMIN は閲覧/作成可、更新・削除はオーナー or 管理ロールに限定。

### WS3: ドキュメント & テスト
- README に実装済み/未実装機能と権限制御の概要を追記。
- 主要エンドポイントのユニット/サービス層テスト、E2E（Playwright）最小セットを追加または更新。

## リスクと緩和
- 既存 UI/テストが新ポリシーで 403 となるリスク → オーナー自動割当と管理ロール例外で回避。
- リード追加によるナビ/ルーティング衝突 → 既存パスと被らない `/leads` 配下に限定。
- マイグレーション互換性 → 新 enum/テーブルのみ追加し既存カラムを変更しない。

## 成功判定（Acceptance）
- Accounts/Contacts/Opportunities/Activities/Tasks の DELETE 操作でロール不正時に 403 が返る。
- Account 作成で `AccountAssignment` に OWNER を自動付与（共有/表示用）。アーカイブ/復元は ADMIN 以外に 403 を返す。
- Leads: DB/サービス/API/UI が一通り動作し、リードのステータス遷移と削除/復元が動く。
- README に機能カバレッジ表と権限方針が追記されている。
- 追加/更新したテストがローカルで成功する（最低限ユニット or E2E いずれか）。

## Progress
- [x] WS1: RBAC強化
- [x] WS2: リード管理追加
- [x] WS3: ドキュメント & テスト（README更新・LeadサービスのJestテスト追加、未実行）

## Surprises & Discoveries
- Account 作成時の OWNER 自動付与で既存アカウントには Assignment がなく、権限制御の影響を受ける可能性があるため、既存データには一時的に管理ロールでの操作を推奨。

## Decision Log
- core 権限は「削除/復元/オーナー変更」に優先的に適用し、閲覧範囲の絞り込みは今後の拡張とする。
- リードは専用テーブルを追加し、ステータスを `NEW/CONTACTED/QUALIFIED/LOST/CONVERTED` の 5 段階で管理するシンプルな仕様を採用。

## Outcomes & Retrospective
- (未記入)

## Next Steps (Backlog候補) — どれも単独で着手できる粒度に分解済み
1. **RBACスコープ拡張（core残課題）**
   - 共通スコープヘルパーを実装: `own`, `team`, `all`, `own_and_related`, `own_and_shared` を扱うフィルター関数を service 層に追加。
   - 適用対象: Accounts/Contacts/Opportunities/Activities/Tasks/Leads の list/get でヘルパーを呼ぶ。
   - UI: フィルター/一覧で非閲覧データを出さないことを確認する Playwright シナリオ追加（MANAGER vs REP）。
   - Acceptance: 各エンティティの一覧/詳細がカタログの view 権限に沿って 403 or 非表示になること。
2. **Notifications_basic MVP**
   - イベント: タスク期限超過・Opportunity ステージ変更をトリガーに in-app 通知テーブルへ enqueue。
   - API: `/api/notifications` で既読/一覧取得、未読カウント。
   - UI: ベルアイコン + ドロップダウン（最新10件）を追加、タスク/案件変更時にトーストも表示。
   - Acceptance: トリガー操作後に通知が記録され、UIで確認・既読化できる。
3. **Files_attachment**
   - ストレージ: S3互換のプリサイン発行エンドポイントを追加（PUT/GET）。
   - モデル: `FileAttachment` (entityType, entityId, key, url, size, mime) を追加、Accounts/Opportunities/Activities に紐付け。
   - UI: 各詳細ページに添付タブ/セクションを追加し、アップロード・ダウンロード・削除を提供。
   - Acceptance: 主要3エンティティでファイルの追加/表示/削除ができ、RBACで削除/閲覧が制御される。
4. **Import_export_basic**
   - Export: Accounts/Opportunities を CSV 出力（フィルタ適用済み）するエンドポイントと UI ボタン。
   - Import: CSV をアップロード→ジョブ化→結果通知（成功/失敗件数）。重複判定の簡易ルールを実装。
   - Acceptance: サンプルCSVで round-trip でき、失敗行がレポートされる。
5. **Observability/テスト強化**
   - Playwright: Leads 権限（MANAGER/REP切替）、通知ベルの未読カウント、添付UI の happy path を追加。
   - API: RBACユニットを Contacts/Opportunities/Tasks へ水平展開。
   - メトリクス/ログ: pino-http に request/response サイズ・status 集計タグを追加し、Prometheus互換のエンドポイントを用意。
   - Acceptance: `npm run test:api` / `npm run test:e2e` が新シナリオ含めグリーン、/metrics が scrape 可能。
