# ギフトショップ向け管理システム

## 概要
ギフトショップ向けの管理システムの要件とディレクトリ構成をまとめたドキュメント。

## 主な機能
1. 顧客プロファイル管理: 名前・連絡先・誕生日・購入履歴・顧客属性、セグメンテーション
2. ロイヤルティ・プログラム: ポイント管理・会員ランク、バースデー特典
3. CRM／マーケティング自動化: メール/SMSキャンペーン管理、パーソナライズドレコメンデーション
4. オンラインストア連携: 商品カタログ同期、カート／決済、ウィッシュリスト／ギフトレジストリ
5. 注文＆配送管理: 注文ステータス追跡、配送業者API連携、発送通知
6. 在庫＆POS連携: リアルタイム在庫把握、自動再発注アラート、オフラインPOS対応
7. レポート＆分析: 顧客LTV、購買頻度、売れ筋商品・死に筋商品レポート
8. 自助型キオスク: 店舗セルフ注文端末対応
9. カスタマーサポート: チャットボット連携、問い合わせチケット管理
10. マルチチャネル連携: 実店舗・EC・モバイルアプリを横断した顧客体験
11. セキュリティ＆コンプライアンス: PCI-DSS準拠、データ暗号化

## ページ一覧
- ダッシュボード: 売上／在庫アラートサマリー
- 顧客管理 (Customers)
  - 一覧
  - 詳細
  - 編集
  - セグメント管理
- ロイヤルティ管理 (Loyalty)
  - ポイント一覧
  - 会員ランク設定
- マーケティング管理 (Marketing)
  - キャンペーン一覧
  - メール/SMSテンプレート
- オンラインストア連携設定 (Store Integration)
  - カタログ同期設定
  - 決済設定
- 商品管理 (Products)
  - カタログ一覧
  - 商品登録
  - 詳細/編集
- 注文管理 (Orders)
  - 一覧
  - 詳細
- 配送管理 (Shipping)
  - ステータス一覧
  - API設定
- 在庫管理 (Inventory)
  - 在庫一覧
  - 自動再発注ルール
- POS連携 (POS Integration)
  - POS設定
  - オフラインモード
- 請求管理 (Invoices)
  - 請求書発行
  - ステータス管理
- プロモーション管理 (Promotions)
  - クーポン一覧
  - クーポン作成
- 顧客サポート (Support)
  - チケット一覧
  - チケット詳細
- レポート (Reports)
  - 売上推移
  - 人気商品
  - 顧客分析 (LTV・購買頻度)
- システム設定 (Settings)

## 推奨ディレクトリ構成
```plaintext
src/app/gift-management/
├─ layout.tsx                    # 共通レイアウト
├─ page.tsx                      # Dashboard
├─ customers/                    # 顧客管理
│   ├─ page.tsx                  # 一覧
│   ├─ [customerId]/
│   │   ├─ page.tsx              # 詳細
│   │   └─ edit/
│   │       └─ page.tsx          # 編集
│   └─ segments/
│       └─ page.tsx              # セグメント管理
├─ loyalty/                      # ロイヤルティ管理
│   ├─ points/
│   │   └─ page.tsx              # ポイント一覧
│   └─ tiers/
│       └─ page.tsx              # 会員ランク設定
├─ marketing/                    # マーケティング管理
│   ├─ campaigns/
│   │   └─ page.tsx              # キャンペーン一覧
│   └─ templates/
│       └─ page.tsx              # メール/SMSテンプレート
├─ store-integration/            # オンラインストア連携設定
│   ├─ catalog-sync/
│   │   └─ page.tsx
│   └─ payment-settings/
│       └─ page.tsx
├─ products/                     # 商品管理
│   ├─ page.tsx                  # カタログ一覧
│   ├─ create/
│   │   └─ page.tsx              # 商品登録
│   └─ [productId]/
│       ├─ page.tsx              # 詳細
│       └─ edit/
│           └─ page.tsx          # 編集
├─ orders/                       # 注文管理
│   ├─ page.tsx                  # 一覧
│   └─ [orderId]/
│       └─ page.tsx              # 詳細
├─ shipping/                     # 配送管理
│   ├─ page.tsx                  # ステータス一覧
│   └─ settings/
│       └─ page.tsx              # API設定
├─ inventory/                    # 在庫管理
│   ├─ page.tsx                  # 在庫一覧
│   └─ reorder-rules/
│       └─ page.tsx              # 自動再発注ルール
├─ pos-integration/              # POS連携
│   ├─ settings/
│   │   └─ page.tsx              # POS設定
│   └─ offline-mode/
│       └─ page.tsx              # オフラインモード
├─ invoices/                     # 請求管理
│   └─ page.tsx                  # 請求書発行・ステータス管理
├─ promotions/                   # プロモーション管理
│   ├─ page.tsx                  # クーポン一覧
│   └─ create/
│       └─ page.tsx              # クーポン作成
├─ support/                      # 顧客サポート
│   └─ tickets/
│       ├─ page.tsx              # チケット一覧
│       └─ [ticketId]/
│           └─ page.tsx          # チケット詳細
├─ reports/                      # レポート
│   ├─ sales/
│   │   └─ page.tsx              # 売上推移
│   ├─ top-products/
│   │   └─ page.tsx              # 人気商品
│   └─ customer-analysis/
│       └─ page.tsx              # 顧客分析
└─ settings/                     # システム設定
    └─ page.tsx
``` 