# ExecPlan: UIフォームのフローティングラベル統一

## メタ情報
- バージョン: v0.1 (2025-11-29 作成)
- オーナー: Codex エージェント
- 参照: AGENTS.md / PLANS.md / user_management ExecPlan

## 背景
- Admin Users 画面では `FloatingInput` / `FloatingSelect` を導入し、ラベルの視認性や必須エラー表示が改善された。
- 他メニュー（Accounts / Contacts / Opportunities / Activities / Tasks / その他 Admin UI）は旧来の placeholder 依存フォームのまま残っており、ラベル有無や挙動が不統一。
- UI 全体でフォーム体験とアクセシビリティを揃えるため、共通コンポーネントを用いて段階的に更新する必要がある。

## ゴール
1. 主要 CRUD / フィルター UI のフォームコンポーネントをすべてフローティングラベル仕様に統一する。
2. 入力例や placeholder を多言語ロケールに整理し、画面ごとに適切な例示を表示する。
3. 変更したフォームに対し、既存の Playwright/E2E テストをフォーム単位で実行して回帰を防ぐ。

## 非ゴール
- 新しいフォームデザインの大幅なビジュアル刷新（テーマやカラーリング変更など）。
- バリデーションロジックの全面見直し（必要な範囲を超えるサーバー側変更）。
- モバイル専用 UI の作り直し。

## ワークストリーム
### WS1: コンポーネント整備
- `FloatingInput`/`FloatingSelect` のユースケース拡張（number/date/textarea 対応、`forceFloatLabel` 等）。
- 必要に応じて `FloatingTextarea` など追加コンポーネントを実装。
- ドキュメント化（README もしくは Storybook 的な記載）で利用方法を明文化。

### WS2: 画面別適用
1. **Accounts**: 追加フォーム、詳細編集フォーム、検索フィルター。
2. **Contacts**: リストフィルター、作成/編集フォーム、関連モーダル。
3. **Opportunities**: カンバン追加、詳細編集、フィルター。
4. **Activities / Tasks**: ログ追加フォーム、タスク作成フォーム。
5. **その他 Admin** (Audit Logs 等): フィルターや招待フォームなど。
- 各画面ごとにロケール placeholder の例示を用意して差し替える。
- レイアウト崩れがある場合はボタン配置やグリッドも調整。

### WS3: テスト・検証
- 各フォーム更新後に該当 Playwright/E2E を実行。
- UI スナップショット（必要に応じて）や手動確認の記録を ExecPlan に追加。
- README / CHANGELOG に主要な UI 変更点を追記。

## リスク / 留意事項
- placeholder 依存のテスト（`getByPlaceholder` 等）が壊れる可能性 → ラベル/`data-testid` に置き換え。
- Select の初期状態や `forceFloatLabel` の挙動で SSR と CSR がズレないよう注意。
- 画面ごとのフォーム構造が異なるため、一括置換ではなく段階的な検証が必要。

## 次ステップ
1. WS1: 追加コンポーネント要否の洗い出しと実装。
2. WS2: Accounts → Contacts → Opportunities → Activities/Tasks → その他 Admin の順で適用。
3. WS3: フォーム単位で Playwright を走らせ、結果を本 ExecPlan に記録。

## Progress
- [x] WS1: `FloatingTextarea` を追加し、`FloatingSelect` に `forceFloatLabel` を導入。Input/Select/Textarea すべてで必須バリデーション・フォーカス中プレースホルダー制御・例示テキスト差し込みを共通化。
- [x] WS2: Accounts / Contacts / Opportunities / Activities / Tasks / Admin Audit Logs のフィルター・フォームをフローティングラベルに置き換え、必要なロケール（ラベル・例示テキスト）も整備。
- [x] 2025-11-29: 既存フォーム全体を監査し、ラベルとプレースホルダーが同一だった箇所をすべて解消。新たに `domainLabel` や `kanaFirstLabel` などの翻訳キーを追加し、例示テキストは placeholder 側へ集約。
- [x] 2025-11-29 pm: 案件詳細のステージ更新フォームも `FloatingSelect` 化し、すべての Select が共通コンポーネント経由になるよう揃えた。
- [x] WS3: Playwright (`accounts.spec.ts`, `contacts.spec.ts`, `opportunities.spec.ts`, `activities.spec.ts`, `tasks.spec.ts`, `audit-logs.spec.ts` いずれも Chromium) を実行し、フォーム単位のリグレッションを確認。

## Surprises & Discoveries
- 既存の `Select` では placeholder 相当の option を二重に描画しがちだったため、`forceFloatLabel` で「初期状態でもラベルを上げる」制御を追加し、検索フィルターなどの UX を維持した。
- Textarea も Input と同じ placeholder/required ルールを期待されていたため、`FloatingTextarea` で高さやフォーカス時の例示挙動を揃えた。
- Lint には従前から `toast-provider`/`use-success-toast` 由来の `react-hooks/set-state-in-effect` エラーが残っている。今回の変更では新規 lint エラーは増やしていないが、将来的にテコ入れが必要。

## Decision Log
- すべてのフォームで placeholder ではなくラベルを主要情報にするため、各フィールドの例示文言をロケールファイルへ追加し、フォーム実装からベタ書きを排除する方針とした。
- フィルター UI では `forceFloatLabel` を用いて初期状態からラベルを上に固定し、値が空でも検索条件の意味を明示するデザインに統一した。
- Validation 表現は `Floating` コンポーネントに集約し、個別フォームで `RequiredMark` を配置しない（必須項目は `required` 属性で宣言する）方針に切り替えた。
- Select コンポーネントのデファクトを `FloatingSelect` とし、新規/既存のセレクトを更新する際は本コンポーネント（必要に応じて `forceFloatLabel`）を必ず使用する。

## Outcomes & Retrospective
- (未記入)
