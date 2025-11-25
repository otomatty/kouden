# pinoロガー移行作業ログ

## 作業概要

issue #17に基づき、`console.log`/`console.error`/`console.warn`をpinoベースの構造化ログシステムに段階的に置き換える作業を実施。

## 実装内容

### 1. ロガーモジュールの作成

- **ファイル**: `src/lib/logger.ts`
- **内容**: 
  - サーバー側: pino + pino-pretty（開発環境）
  - クライアント側: console.logベースのカスタムロガー
  - ログレベル管理（DEBUG, INFO, WARN, ERROR）
  - 環境変数`LOG_LEVEL`による制御
  - 構造化ログのサポート

### 2. 環境変数の型定義追加

- **ファイル**: `src/types/env.d.ts`
- **追加内容**: `LOG_LEVEL: string;`

## 完了した作業

### 完了ファイル一覧（約497箇所を置き換え済み）

#### Server Actions（主要ファイル）

1. ✅ `src/app/_actions/admin/dashboard.ts` - 完了
2. ✅ `src/app/_actions/entries.ts` - 完了
3. ✅ `src/app/_actions/admin/users.ts` - 完了
4. ✅ `src/app/_actions/members.ts` - 完了
5. ✅ `src/app/_actions/roles.ts` - 完了
6. ✅ `src/app/_actions/user-surveys.ts` (14箇所) - 完了
7. ✅ `src/app/_actions/auth.ts` (2箇所) - 完了
8. ✅ `src/app/_actions/notifications.ts` (2箇所) - 完了
9. ✅ `src/app/_actions/contact.ts` (5箇所) - 完了
10. ✅ `src/app/_actions/profiles.ts` (4箇所) - 完了
11. ✅ `src/app/_actions/invitations.ts` (17箇所) - 完了
12. ✅ `src/app/_actions/telegrams.ts` (7箇所) - 完了
13. ✅ `src/app/_actions/offerings.ts` (13箇所) - 完了
14. ✅ `src/app/_actions/relationships.ts` (11箇所) - 完了
15. ✅ `src/app/_actions/announcements.ts` (10箇所) - 完了
16. ✅ `src/app/_actions/koudens/read.ts` (4箇所) - 完了
17. ✅ `src/app/_actions/koudens/create.ts` (2箇所) - 完了
18. ✅ `src/app/_actions/koudens/update.ts` (1箇所) - 完了
19. ✅ `src/app/_actions/koudens/delete.ts` (3箇所) - 完了
20. ✅ `src/app/_actions/koudens/duplicate.ts` (1箇所) - 完了
21. ✅ `src/app/_actions/settings.ts` (6箇所) - 完了
22. ✅ `src/app/_actions/exportReceipt.ts` (7箇所) - 完了
23. ✅ `src/app/_actions/exportPdf.ts` (3箇所) - 完了
24. ✅ `src/app/_actions/hearing-applications.ts` (9箇所) - 完了
25. ✅ `src/app/_actions/purchaseKouden.ts` (3箇所) - 完了
26. ✅ `src/app/_actions/plans.ts` (1箇所) - 完了

#### return-records関連（全ファイル完了）

27. ✅ `src/app/_actions/return-records/crud.ts` (5箇所) - 完了
28. ✅ `src/app/_actions/return-records/bulk-update.ts` (7箇所) - 完了
29. ✅ `src/app/_actions/return-records/return-items.ts` (8箇所) - 完了
30. ✅ `src/app/_actions/return-records/updates.ts` (4箇所) - 完了
31. ✅ `src/app/_actions/return-records/return-record-items.ts` (6箇所) - 完了
32. ✅ `src/app/_actions/return-records/return-record-selected-methods.ts` (5箇所) - 完了
33. ✅ `src/app/_actions/return-records/return-method-types.ts` (5箇所) - 完了
34. ✅ `src/app/_actions/return-records/bulk-operations.ts` (3箇所) - 完了
35. ✅ `src/app/_actions/return-records/pagination.ts` (1箇所) - 完了
36. ✅ `src/app/_actions/return-records/performance-monitor.ts` (1箇所) - 完了
37. ✅ `src/app/_actions/return-records/bulk-update-optimized.ts` (1箇所) - 完了

#### API Routes

38. ✅ `src/app/api/stripe/webhook/route.ts` - 完了
39. ✅ `src/app/api/debug/organization-access/route.ts` - 完了
40. ✅ `src/app/api/csrf-token/route.ts` - 完了
41. ✅ `src/app/api/ai/generate/route.ts` (4箇所) - 完了
42. ✅ `src/app/api/ai/translate/route.ts` (1箇所) - 完了
43. ✅ `src/app/api/cron/send-reminders/route.ts` (2箇所) - 完了
44. ✅ `src/app/api/availability/route.ts` (1箇所) - 完了
45. ✅ `src/app/api/koudens/[id]/entries/route.ts` (1箇所) - 完了

#### セキュリティ・ユーティリティ

46. ✅ `src/lib/security/security-logger.ts` - 完了
47. ✅ `src/lib/security/ip-restrictions.ts` (4箇所) - 完了
48. ✅ `src/lib/security/csrf-protection.ts` (3箇所) - 完了
49. ✅ `src/lib/security/file-upload-validation.ts` (3箇所) - 完了
50. ✅ `src/lib/security/admin-2fa-enforcement.ts` (2箇所) - 完了
51. ✅ `src/lib/security/rate-limiting.ts` (1箇所) - 完了
52. ✅ `src/lib/security/login-attempts.ts` (1箇所) - 完了
53. ✅ `src/lib/errors.ts` - 完了
54. ✅ `src/lib/access.ts` (17箇所) - 完了
55. ✅ `src/lib/supabase/server.ts` (1箇所) - 完了
56. ✅ `src/lib/changelogs.ts` (2箇所) - 完了
57. ✅ `src/lib/milestones.ts` (2箇所) - 完了

#### admin関連（全ファイル完了）

58. ✅ `src/app/_actions/admin/users.ts` (1箇所) - 完了
59. ✅ `src/app/_actions/admin/survey-export.ts` (4箇所) - 完了
60. ✅ `src/app/_actions/admin/admin-2fa.ts` (3箇所) - 完了
61. ✅ `src/app/_actions/admin/campaign-applications.ts` (7箇所) - 完了
62. ✅ `src/app/_actions/admin/permissions.ts` (3箇所) - 完了
63. ✅ `src/app/_actions/admin/contact-requests.ts` (6箇所) - 完了
64. ✅ `src/app/_actions/admin/middleware.ts` (2箇所) - 完了
65. ✅ `src/app/_actions/admin/announcements.ts` (1箇所) - 完了

#### funeral関連（全ファイル完了）

66. ✅ `src/app/_actions/funeral/cases/getCase.ts` (1箇所) - 完了
67. ✅ `src/app/_actions/funeral/kouden/create.ts` (5箇所) - 完了
68. ✅ `src/app/_actions/funeral/customers/updateCustomer.ts` (4箇所) - 完了
69. ✅ `src/app/_actions/funeral/customers/createCustomer.ts` (3箇所) - 完了
70. ✅ `src/app/_actions/funeral/customers/getCustomer.ts` (3箇所) - 完了

## 残りの作業（約22箇所、9ファイル）

### 優先度：中

#### blog関連（約7箇所、2ファイル）

1. ⏳ `src/app/_actions/blog/analytics.ts` (3箇所)
2. ⏳ `src/app/_actions/blog/bookmarks.ts` (4箇所)

#### offerings関連（約7箇所、2ファイル）

3. ⏳ `src/app/_actions/offerings/allocation.ts` (3箇所)
4. ⏳ `src/app/_actions/offerings/queries.ts` (4箇所)

### 優先度：低

#### その他の小規模ファイル（約8箇所、6ファイル）

5. ⏳ `src/app/_actions/help/help-items.ts` (3箇所)
6. ⏳ `src/app/_actions/common/organizationRequests.ts` (1箇所)
7. ⏳ `src/app/_actions/updateKoudenPlan.ts` (1箇所)
8. ⏳ `src/app/_actions/validateDuplicateEntries.ts` (1箇所)
9. ⏳ `src/app/_actions/email.ts` (1箇所)
10. ⏳ `src/app/_actions/feedback.ts` (1箇所)

## 進捗状況

- **総数**: 約562箇所
- **完了**: 約540箇所（約96%）
- **残り**: 約22箇所（約4%）
- **完了ファイル数**: 70ファイル以上
- **残りファイル数**: 9ファイル

## 置き換えパターン

### 基本的な置き換え例

```typescript
// Before
console.error("エラーメッセージ:", error);

// After
import logger from "@/lib/logger";
logger.error(
  {
    error: error instanceof Error ? error.message : String(error),
    context: "追加のコンテキスト情報",
  },
  "エラーメッセージ"
);
```

### 構造化ログの形式

```typescript
// エラーログ
logger.error(
  {
    error: error.message,
    code: error.code,
    userId: user.id,
    koudenId,
  },
  "操作名エラー"
);

// 情報ログ
logger.info(
  {
    userId: user.id,
    action: "create_entry",
    koudenId,
  },
  "香典情報を作成しました"
);

// 警告ログ
logger.warn(
  {
    userId: user.id,
    reason: "権限不足",
  },
  "アクセス拒否"
);
```

## 次のステップ

1. ✅ **admin関連ファイルの更新**（優先度：高） - 完了
   - 管理者機能は重要なため、優先的に更新
   
2. ✅ **funeral関連ファイルの更新**（優先度：高） - 完了
   - 葬儀関連機能も重要な機能のため、優先的に更新

3. **blog関連ファイルの更新**（優先度：中）
   - ブログ機能のログを統一

4. **offerings関連ファイルの更新**（優先度：中）
   - お供物関連のログを統一

5. **その他の小規模ファイルの更新**（優先度：低）
   - 残りの小規模ファイルを順次更新

## 注意事項

- すべての`console.log`/`console.error`/`console.warn`を`logger`に置き換える
- エラーログには適切なコンテキスト情報を含める
- ユーザーID、リソースIDなどの重要な情報を構造化ログに含める
- 本番環境では`LOG_LEVEL=info`を推奨
- 開発環境では`LOG_LEVEL=debug`で詳細なログを出力

## 完了後の確認事項

- [ ] すべての`console.log`/`console.error`/`console.warn`が置き換えられているか確認
- [ ] ログレベルの設定が適切か確認
- [ ] 構造化ログの形式が統一されているか確認
- [ ] 本番環境でのログ出力が適切か確認

---

**最終更新日**: 2025-01-XX
**作業者**: AI Assistant
**関連Issue**: #17

