# 葬儀会社向け管理システム

## 概要
葬儀会社向けの管理システムの要件とディレクトリ構成をまとめたドキュメント。

## ページ一覧
- ダッシュボード: 売上／案件進捗サマリー
- 葬儀案件一覧
- 葬儀案件作成
- 葬儀案件詳細（故人情報、会場／日時、担当者）
- 葬儀案件編集
- 参列者一覧
- 参列者詳細
- 香典受付記録一覧
- 香典受付記録作成
- 香典受付記録編集
- 顧客連絡管理（メール/SMSテンプレート、送信履歴）
- レポート（日次／月次売上、会場別利用状況）
- ユーザー／権限管理
- システム設定

## 推奨ディレクトリ構成
```plaintext
src/app/funeral-management/
├─ layout.tsx                    # 共通レイアウト
├─ page.tsx                      # Dashboard
├─ cases/
│   ├─ page.tsx                  # 一覧
│   ├─ create/
│   │   └─ page.tsx              # 作成
│   └─ [caseId]/
│       ├─ page.tsx              # 詳細
│       └─ edit/
│           └─ page.tsx          # 編集
├─ attendees/
│   ├─ page.tsx                  # 参列者一覧
│   └─ [attendeeId]/
│       └─ page.tsx              # 参列者詳細
├─ donations/
│   ├─ page.tsx                  # 香典受付一覧
│   ├─ create/
│   │   └─ page.tsx              # 作成
│   └─ [donationId]/
│       └─ edit/
│           └─ page.tsx          # 編集
├─ contacts/
│   └─ page.tsx                  # 顧客連絡管理
├─ reports/
│   ├─ monthly/
│   │   └─ page.tsx
│   └─ venue-usage/
│       └─ page.tsx
├─ users/
│   └─ page.tsx                  # ユーザー／権限管理
└─ settings/
    └─ page.tsx                  # システム設定
``` 