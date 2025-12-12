# 一覧ページレイアウト ガイド（リード画面テンプレート）

目的: 一覧ページの構成をリード画面準拠で統一し、将来のページ追加時も同じ UX を維持する。

## 使い方（基本構成）
1. `ListPageLayout` を使う  
   ```tsx
   <ListPageLayout
     title={t('title')}
     description={t('description')}
     searchSection={<Card>...検索フォーム...</Card>}
   >
     <div className="grid gap-6 lg:grid-cols-[1.5fr,0.5fr]">
       {/* 一覧カード */}
       <Card>...ListToolbar + Table/List + PaginationBar...</Card>
       {/* 右カラム（フォーム等） */}
       <Card>...</Card>
     </div>
   </ListPageLayout>
   ```

2. 上部ツールバーは `ListToolbar` を利用  
   - 左: サマリ文字列（`common.listSummaryWithTotal` / `listSummaryPageSizeOnly` で生成）  
   - 右: `PageSizeSelector` + `PaginationBarLite` などを配置

3. 下部に `PaginationBar` を配置する（一覧カード内の最後）。

4. 見出しは「{メニュー名}一覧」、英語は “{Menu} List” で統一。

## 文言
- サマリ: `tCommon('listSummaryWithTotal', { values: { total, pageSize } })` を優先。total が無ければ `listSummaryPageSizeOnly`。

## チェックリスト（一覧ページを作る/直すとき）
- [ ] `ListPageLayout` を使用している
- [ ] 見出しが「◯◯一覧」/“◯◯ List” になっている
- [ ] サマリ表示をしている（total ありは withTotal を使用）
- [ ] 上部ツールバーに PageSizeSelector + PaginationBarLite
- [ ] 下部に PaginationBar
- [ ] 作成 UI の有無は要件に従う（今回のテンプレートでは作成 UI は任意）
