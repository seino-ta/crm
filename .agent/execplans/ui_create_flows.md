# ExecPlan: 作成フローのUIパターン統一（モーダル/ドロワー/専用ページ）とテスト整合

## メタ情報
- バージョン: v1.0 (2025-12-16 作成)
- 作成者: Codex エージェント
- 参照: AGENTS.md, PLANS.md, web_ui_playwright ExecPlan, api_e2e_tests ExecPlan

## 背景と目的
- 各メニューの「新規作成」UIがページ内フォーム・モーダル・別ページで混在しており、UXが統一されていない。
- Task/Activity/Contact など軽量フォームはモーダル/ドロワー化、Account/Opportunity/Lead はスライドオーバーを基本とし、Convert Lead など複合フローは専用ページ化する方針を明文化し実装する。
- フロントPlaywright・API E2E を壊さず通過させる（変更に直接起因しない修正は避ける）。

## スコープ
- UIパターンの決定と実装: accounts / opportunities / leads / activities / tasks / contacts の新規作成エントリポイント
- Convert Lead 専用ページの設計ドラフト作成（実装は別WSでよいが入口だけ定義）
- Playwrightテストの更新: 既存シナリオを新UIに対応させ、スクリーンショット生成手順を保持
- APIは非改変（UI側での呼び出し方のみ調整）

## 非スコープ
- 新しいビジネスロジックの追加（バリデーション/フィールド追加などは行わない）
- RBAC変更やエンドポイントの仕様変更
- デザインシステム大規模刷新

## 成果物
- UIパターン決定の反映（モーダル/スライドオーバー/専用ページ）と実装コード
- 必要なPlaywrightテストのアップデート（パス確認）
- ドキュメント更新（必要箇所: READMEまたは docs/ui/* に「作成フロー指針」追記）

## 実装ストリーム
1) 現状把握
   - 各ページの「新規」操作導線とフォーム配置を洗い出し（accounts/opportunities/leads/activities/tasks/contacts）
   - 既存Playwrightシナリオへの影響を一覧化
2) パターン適用
   - 軽量フォーム: activities, tasks, contacts → モーダル（もしくは既存UIに倣うスライドオーバー）へ統一
   - 中量フォーム: accounts, opportunities, leads → スライドオーバー化
   - 複合/将来拡張: Convert Lead 入口をメニュー or leads一覧に追加し、専用ページ `/leads/convert` を用意（中身は簡易プレースホルダでよい）
3) UXディテール
   - フォーカス管理・ESCクローズ・成功時のトースト表示・一覧リフレッシュを確認
   - モーダル/ドロワー内でバリデーションエラー表示が既存と同等に機能することをチェック
4) テスト更新
   - Playwright: 新UIに合わせて操作手順を修正（特に作成開始のトリガー、保存ボタン、成功トースト）
   - 必要に応じてスクリーンショット差分を更新（`ui:snapshots`）
5) ドキュメント
   - `docs/ui/common-components.md` などに作成フロー指針を追記
   - ExecPlan Progress/Decision を更新
6) 検証
   - `npm --prefix apps/web run test:e2e`
   - バックエンド影響なしを確認（`npm --prefix apps/api run test:e2e` はリグレッション確認用に任意）

## Acceptance Criteria
- 指定した各メニューの「新規作成」が定めたパターン（モーダル/スライドオーバー/専用ページ）で動作する
- 成功トーストと一覧更新が機能し、Playwright e2e がグリーン
- 変更が原因で既存フィールドやAPI呼び出しに破壊的変更がない
- ドキュメントにパターン選定方針が明記されている

## Progress
- 2025-12-16: v1.0 作成
- 2025-12-16: Convert Lead 専用ページのプレースホルダ `/leads/convert` を追加し、Leads 一覧から導線を配置。UIパターンガイドを docs/ui/common-components.md に追記。

## Surprises & Discoveries
- (未記入)

## Decision Log
- 2025-12-16: 作成UIは「軽量=モーダル/ドロワー」「中量=スライドオーバー」「複合=専用ページ」という階層で整理する方針

## Outcomes & Retrospective
- (未記入)
