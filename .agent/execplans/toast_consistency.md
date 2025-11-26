# ExecPlan: 成功トースト一貫性強化

## メタ情報
- バージョン: v0.1 (2025-11-26 作成)
- オーナー: Codex エージェント
- 対象リポジトリ: ~/work/crm (apps/web フロントエンド)
- 参照資料: AGENTS.md, SuccessToast 実装履歴,ユーザー要望「他メニューにも適用」

## 背景
- `SuccessToast` を改修し、アカウント編集フォームでは画面再描画後でも確実にトーストが表示されるようになったが、その他のフォーム (活動/タスク/案件/ステージ更新/追加フォーム) は旧ロジックのままで、ステータスやフィールドのみ変更した際にトーストが出ないケースが残っている。
- グローバルトーストを用いる画面では、`router.refresh()` や `router.replace()` 後に state が失われるため、トースト発火の整合性を保つ仕組みが共通化されていない。
- Playwright でもアカウント画面しか検証しておらず、他メニューで未表示が再発しても検知できない。

## ゴール
1. 活動・タスク・案件 (新規/更新) および案件ステージ更新フォームがすべて成功時にトーストを表示し、画面遷移/refresh 後でも一貫して確認できる。
2. 共通ユーティリティ (hook or helper) により、フォームごとに同じロジックをコピーせずに済む。
3. Playwright シナリオで代表的な 3 画面以上 (例: アカウント、案件、タスク) で成功トーストが実際に表示されることを自動確認できる。

## 非ゴール
- API 側のレスポンスフォーマット変更や新規エンドポイント追加。
- SuccessToast のビジュアル刷新 (必要最低限の UI に留める)。
- useSuccessToast フックを利用している削除ボタン類の再設計 (今回はフォーム送信フローに限定)。

## アプローチ / ワークストリーム

### WS1: 共通トーストトラッカー実装
- `apps/web/src/hooks` にフォーム専用の `useFormSuccessToast` (仮) を追加。`sessionStorage` に送信時スナップショットと TTL を保存し、`initialValues` と照合してトースト発火する仕組みを切り出す。
- 既存のアカウントフォーム実装をこの hook で簡潔に書き直し、API 破壊的変更がないことを確認。

### WS2: 各フォームへの適用
- 対象: `activities/activity-form.tsx`, `tasks/task-form.tsx`, `opportunities/opportunity-form.tsx`, `opportunities/[id]/stage-update-form.tsx` (必要なら他のサーバーアクション利用フォームも洗い出す)。
- それぞれ `useActionState` + 共通 hook を用いて state/redirect/トースト処理を統一。既存の state 構造 (例: `state?.ok`) を崩さず移行。
- 成功メッセージ (翻訳キー) は従来通り `tToast(...)` を利用し、hook へ trigger を受け渡す実装に変更。

### WS3: 自動テスト更新
- Playwright (`apps/web/tests/e2e/crm-flow.spec.ts`) に、アカウント/案件/タスクの順でフォームを送信し `data-testid="global-toast"` を待機する手順を追加。
- 可能なら追加の軽量テスト (例: tasks/task-form 単体) を追加し、CI 依存なしで `npm run test:e2e` が成功することを確認。

## スケジュール目安
1. WS1: 0.5 日 – hook 設計・既存フォーム (accounts) への置き換え。
2. WS2: 0.75 日 – 他フォーム適用と動作確認。
3. WS3: 0.25 日 – Playwright 修正と実行ログ取得。

## 受け入れ基準
- 対象すべてのフォームで、成功後 2 秒以内にグローバルトーストが DOM に現れる (Playwright で検証)。
- 再利用 hook により、新規フォームで必要なロジックが `useFormSuccessToast` 呼び出し + `SuccessToast` 1 行で済む。
- `npm --prefix apps/web run lint` と `npm --prefix apps/web run test:e2e` がローカルで成功する。
- ドキュメント (必要箇所) に利用方法が追記されている。

## Progress
- [x] WS1 共通トラッカー実装 — `useFormSuccessToast` を hooks 配下に追加し、スナップショットと sessionStorage を介してトーストを再生できる仕組みを共通化。
- [x] WS2 各フォーム適用 — アカウント/活動/タスク/案件作成フォームと案件ステージ更新フォームをフックで置き換え、`SuccessToast` への trigger を統一。
- [x] WS3 Playwright 検証 — `crm-flow.spec.ts` にトースト検証を追記し、日本語/英語双方の文言に対応させた上で `npm --prefix apps/web run test:e2e` を実行してパスを確認。

## Surprises & Discoveries
- QA 環境では初回ログイン時に英語ロケールでトーストが表示されるため、Playwright 期待値を多言語対応にしないと false negative が発生する。
- React 19 の `useEffectEvent` はカスタムフック外には露出できないため、共通フックでは `useCallback` + Effect Event を組み合わせて lint を回避する必要があった。

## Decision Log
- フォーム送信時ではなく「成功確定時」に限ってフォームスナップショットを `sessionStorage` へ書き込むことで、失敗時に誤ってトーストが出ないようにした。
- Playwright ではトーストの正確な文言一致ではなく正規表現マッチングを採用し、言語切替が行われても検証が安定するようにした。

## Outcomes & Retrospective
- (未記入)
