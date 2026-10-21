# データベース構造

このディレクトリには、アプリケーションで使用されているデータベースの構造に関するドキュメントが含まれています。

## テーブル一覧

1. [admin_audit_logs](./admin_audit_logs.md) - 管理者の操作ログ
2. [admin_users](./admin_users.md) - 管理者ユーザー
3. [debug_logs](./debug_logs.md) - デバッグログ
4. [kouden_entries](./kouden_entries.md) - 香典帳エントリー
5. [kouden_entry_audit_logs](./kouden_entry_audit_logs.md) - 香典帳エントリーの操作ログ
6. [kouden_entry_locks](./kouden_entry_locks.md) - 香典帳エントリーのロック情報
7. [kouden_invitations](./kouden_invitations.md) - 香典帳への招待情報
8. [kouden_members](./kouden_members.md) - 香典帳のメンバー
9. [kouden_roles](./kouden_roles.md) - 香典帳のロール
10. [koudens](./koudens.md) - 香典帳
11. [offering_entries](./offering_entries.md) - お供え物のエントリー
12. [offering_photos](./offering_photos.md) - お供え物の写真
13. [offerings](./offerings.md) - お供え物
14. [profiles](./profiles.md) - ユーザープロフィール
15. [relationships](./relationships.md) - 関係性
16. [return_items](./return_items.md) - 返礼品
17. [support_tickets](./support_tickets.md) - サポートチケット
18. [system_announcements](./system_announcements.md) - システムお知らせ
19. [telegrams](./telegrams.md) - 電報
20. [ticket_messages](./ticket_messages.md) - チケットメッセージ
21. [user_announcement_reads](./user_announcement_reads.md) - ユーザーのお知らせ既読状態
22. [user_settings](./user_settings.md) - ユーザー設定

## テーブル構造の詳細

各テーブルの詳細な構造は、それぞれのリンク先のドキュメントを参照してください。

## テーブル間の関連

テーブル間の関連については、各テーブルのドキュメント内で外部キー制約として記載されています。 
## 本番に未適用のマイグレーション

### `20261018010000_align_telegram_offering_entry_rls_role_names.sql`（#184）

本番の `kouden_roles` の名前は `editor` / `viewer` だけですが、弔電（`telegrams`）の INSERT / UPDATE / DELETE と供物の紐づけ（`offering_entries`）の SELECT のポリシーは、日本語の `編集者` / `閲覧者` を要求しています。そのため、オーナー・作成者以外の編集者は弔電を編集できず、供物の紐づけも読めません。このマイグレーションは 4 件のポリシーを、ほかのテーブルと同じ「ロール名または権限配列（`entry.write` / `entry.read`）」で作り直します。データは変えません。

2026-10-18 時点で本番には未適用です。適用するときは次の順に進めます。

1. 適用前に、置き換える 4 件の定義を控える（下の確認 SQL）。
2. SQL Editor に、このファイルの内容を `BEGIN;` と `COMMIT;` で囲んで貼り付けて実行する。`supabase db push` は使わない。本番に未適用のほかのマイグレーション（データを書き換える `20260616000000_atomize_return_entry_record_total_amount.sql` など）もまとめて適用されるため。
3. 確認 SQL で、`編集者` / `閲覧者` を含むポリシーが 0 件になったことを確かめる。
4. オーナーでも作成者でもない編集者のアカウントで、弔電の追加・編集・削除と、供物の紐づけの表示を確かめる。

```sql
-- 弔電・供物の紐づけのポリシー定義（控え用）
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('telegrams', 'offering_entries')
ORDER BY tablename, policyname;

-- 日本語のロール名を参照するポリシー（適用前は置き換え対象の 4 件、適用後は 0 件）
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%編集者%' OR qual LIKE '%閲覧者%'
    OR with_check LIKE '%編集者%' OR with_check LIKE '%閲覧者%');
```

戻すときは、手順 1 で控えた定義で 4 件を作り直します。
