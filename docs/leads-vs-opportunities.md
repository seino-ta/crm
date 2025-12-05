# リードとオポチュニティの設計ノート

## 役割の違い
- **Lead**: まだ商談化していない見込み。アカウントは任意。接点の有無や温度感を軽量に管理する。
- **Opportunity**: 商談（案件）。アカウント必須。金額・確度・ステージに基づきパイプラインで管理する。

## 項目の差分（現状実装）
- Lead: name, company?, email?, phone?, source?, notes?, status(NEW/CONTACTED/QUALIFIED/LOST/CONVERTED), ownerId, accountId(optional)
- Opportunity: name, accountId(required), ownerId, stageId, amount?, currency, probability?, expectedCloseDate?, status(OPEN/WON/LOST/ARCHIVED), contactId?, lostReason?, description?

## 連携の今後
- 「顧客化（Convert Lead）」フロー未実装。想定: Lead を選択し、Account/Contact/Opportunity を一括生成 or 既存に紐付け。
- Activity/Task は現状 Opportunity/Account/Contact に紐付ける設計。Lead には直接紐付けず、顧客化時に必要なら引き継ぐ方針。

## RBAC との関係
- Lead/Opportunity ともに OWNER or MANAGER/ADMIN が更新・削除可能。閲覧スコープ（own/team/all）は今後共通フィルター導入予定。

## レポート/ダッシュボードへの扱い
- レポートは Opportunity ベース（売上/パイプライン）。Lead は軽量の数/ステータス集計を追加予定（未実装）。

## UI ナビゲーション
- `/leads` は独立メニュー。Opportunity は `/opportunities` でパイプライン/リストを扱う。将来的に「顧客化」アクションを Leads 一覧に追加予定。

## 未決事項/ToDo
- Convert Lead の仕様: 生成先 (Account/Contact/Opportunity) の自動/手動マッピングルールを定義。
- ステータス/ステージのマッピング: Lead.QUALIFIED → Opportunity 初期ステージの対応を決める。
- Activity/Task 引き継ぎ方針: 顧客化時にコピーするか、Lead に紐付けないままクローズするかを決定。
