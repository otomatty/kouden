# ギフトショップ向け管理システム

## 概要
ギフトショップ向けの管理システムの要件とディレクトリ構成をまとめたドキュメント。

## ページ一覧
- ダッシュボード: 売上／在庫アラートサマリー
- 商品カタログ一覧
- 商品登録
- 商品詳細／編集
- 注文一覧
- 注文詳細
- 在庫管理
- 請求書発行
- プロモーション管理（クーポン作成／一覧）
- 顧客サポート（問い合わせチケット）
- レポート（売上推移、人気商品）
- システム設定

## 推奨ディレクトリ構成
```plaintext
src/app/gift-management/
├─ layout.tsx                    # 共通レイアウト
├─ page.tsx                      # Dashboard
├─ products/
│   ├─ page.tsx                  # カタログ一覧
│   ├─ create/
│   │   └─ page.tsx              # 商品登録
│   └─ [productId]/
│       ├─ page.tsx              # 詳細
│       └─ edit/
│           └─ page.tsx          # 編集
├─ orders/
│   ├─ page.tsx                  # 注文一覧
│   └─ [orderId]/
│       └─ page.tsx              # 注文詳細
├─ inventory/
│   └─ page.tsx                  # 在庫管理
├─ invoices/
│   └─ page.tsx                  # 請求書
├─ promotions/
│   ├─ page.tsx                  # 一覧
│   └─ create/
│       └─ page.tsx              # クーポン発行
├─ support/
│   └─ tickets/
│       ├─ page.tsx              # 問い合わせ一覧
│       └─ [ticketId]/
│           └─ page.tsx          # チケット詳細
├─ reports/
│   ├─ sales/
│   │   └─ page.tsx              # 売上推移レポート
│   └─ top-products/
│       └─ page.tsx              # 人気商品レポート
└─ settings/
    └─ page.tsx                  # システム設定
``` 