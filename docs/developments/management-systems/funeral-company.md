# 葬儀会社向け管理システム

## 概要
葬儀会社向けの管理システムの要件とディレクトリ構成をまとめたドキュメント。

## 主な機能
1. 顧客管理(CRM): 問い合わせ～契約～施行後フォローの一元管理、コミュニケーション履歴や顧客属性管理（宗派・アレルギー等）
2. 見積・請求管理: 見積書作成・PDF出力、請求書/領収書発行・ステータス管理
3. 資材受発注・在庫管理: 祭壇資材や返礼品の発注状況トラッキング、在庫残高のリアルタイム把握
4. ワークフロー・タスク管理: 施行スケジュール管理・スタッフアサイン、アフターセールス（リマインド・アンケート）
5. 分析・レポート: 施行件数、売上単価推移、顧客満足度レポート、KPIダッシュボード
6. リアルタイム情報共有: クラウド更新による全拠点・全スタッフへの即時データ反映、アップデート無償提供
7. モバイル＆オンライン予約: スマホ対応UI、オンライン火葬予約受付機能

## ページ一覧
- ダッシュボード: 売上／案件進捗サマリー
- 顧客管理 (CRM)
  - 一覧
  - 詳細
  - 属性編集
- 葬儀案件 (Cases)
  - 一覧
  - 作成
  - 詳細
  - 編集
- 参列者 (Attendees)
  - 一覧
  - 詳細
- 香典受付記録 (Donations)
  - 一覧
  - 作成
  - 編集
- 顧客連絡管理 (Contacts)
  - メール/SMSテンプレート
  - 送信履歴
- 見積管理 (Quotes)
  - 一覧
  - 作成
  - PDF表示
- 請求管理 (Invoices)
  - 一覧
  - 発行
  - 詳細
- 資材管理 (Materials)
  - 発注一覧
  - 発注詳細
  - 在庫一覧
- タスク管理 (Tasks)
  - 一覧
  - スケジュール管理
  - スタッフアサイン
- オンライン予約管理 (Reservations)
  - 火葬予約一覧
  - 予約詳細
- レポート (Reports)
  - 月次売上レポート
  - 会場別利用状況
  - KPIダッシュボード
- ユーザー／権限管理 (Users)
- システム設定 (Settings)

## 推奨ディレクトリ構成
```plaintext
src/app/funeral-management/
├─ layout.tsx                    # 共通レイアウト
├─ page.tsx                      # Dashboard
├─ customers/                    # 顧客管理 (CRM)
│   ├─ page.tsx                  # 一覧
│   └─ [customerId]/
│       ├─ page.tsx              # 詳細
│       └─ edit/
│           └─ page.tsx          # 属性編集
├─ cases/                        # 葬儀案件 (Cases)
│   ├─ page.tsx                  # 一覧
│   ├─ create/
│   │   └─ page.tsx              # 作成
│   └─ [caseId]/
│       ├─ page.tsx              # 詳細
│       └─ edit/
│           └─ page.tsx          # 編集
├─ attendees/                    # 参列者 (Attendees)
│   ├─ page.tsx                  # 一覧
│   └─ [attendeeId]/
│       └─ page.tsx              # 詳細
├─ donations/                    # 香典受付記録 (Donations)
│   ├─ page.tsx                  # 一覧
│   ├─ create/
│   │   └─ page.tsx              # 作成
│   └─ [donationId]/
│       └─ edit/
│           └─ page.tsx          # 編集
├─ contacts/                     # 顧客連絡管理 (Contacts)
│   └─ page.tsx                  # メール/SMSテンプレート・送信履歴
├─ quotes/                       # 見積管理 (Quotes)
│   ├─ page.tsx                  # 一覧
│   ├─ create/
│   │   └─ page.tsx              # 作成
│   └─ [quoteId]/
│       └─ page.tsx              # PDF表示
├─ invoices/                     # 請求管理 (Invoices)
│   ├─ page.tsx                  # 一覧
│   ├─ create/
│   │   └─ page.tsx              # 発行
│   └─ [invoiceId]/
│       └─ page.tsx              # 詳細
├─ materials/                    # 資材管理 (Materials)
│   ├─ orders/
│   │   ├─ page.tsx              # 発注一覧
│   │   └─ [orderId]/
│   │       └─ page.tsx          # 発注詳細
│   └─ inventory/
│       └─ page.tsx              # 在庫一覧
├─ tasks/                        # タスク管理 (Tasks)
│   ├─ page.tsx                  # 一覧
│   ├─ schedule/
│   │   └─ page.tsx              # スケジュール管理
│   └─ assignments/
│       └─ page.tsx              # スタッフアサイン
├─ reservations/                 # オンライン予約管理 (Reservations)
│   ├─ page.tsx                  # 火葬予約一覧
│   └─ [reservationId]/
│       └─ page.tsx              # 予約詳細
├─ reports/                      # レポート (Reports)
│   ├─ monthly/
│   │   └─ page.tsx              # 月次売上レポート
│   ├─ venue-usage/
│   │   └─ page.tsx              # 会場別利用状況
│   └─ kpi/
│       └─ page.tsx              # KPIダッシュボード
├─ users/                        # ユーザー／権限管理 (Users)
│   └─ page.tsx                  # 一覧・編集
└─ settings/                     # システム設定 (Settings)
    └─ page.tsx
``` 