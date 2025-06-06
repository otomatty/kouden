# リマインダー機能 実装手順

## 概要
無料プランの閲覧期限に合わせて、ユーザーに対して「閲覧期限2日前」「1日前」「当日」のリマインダーをメール＆アプリ内通知で送信します。

## 1. API Route 作成
ファイル: `src/app/api/cron/send-reminders/route.ts`

```ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET() {
  // Supabase 管理クライアント取得
  const supabase = createAdminClient();

  // 無料プランID取得
  const { data: freePlan, error: planError } = await supabase
    .from('plans')
    .select('id')
    .eq('code', 'free')
    .single();
  if (planError || !freePlan) {
    console.error('[send-reminders] planError:', planError);
    return NextResponse.error();
  }

  // 通知シナリオ定義
  const scenarios = [
    { daysLeft: 2, typeKey: 'reminder_before', message: '閲覧期限まであと2日です。' },
    { daysLeft: 1, typeKey: 'reminder_before', message: '閲覧期限まであと1日です。' },
    { daysLeft: 0, typeKey: 'reminder_after',  message: '閲覧期限当日です。' },
  ];

  for (const { daysLeft, typeKey, message } of scenarios) {
    // 対象日を計算 (作成日 + 14 - daysLeft)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (14 - daysLeft));
    const dateStr = targetDate.toISOString().split('T')[0];

    // 対象の香典帳を取得
    const { data: koudenList, error: koudenError } = await supabase
      .from('koudens')
      .select('id, owner_id')
      .eq('plan_id', freePlan.id)
      .eq("created_at::date", dateStr);
    if (koudenError || !koudenList) {
      console.error('[send-reminders] koudenError:', koudenError);
      continue;
    }

    for (const kouden of koudenList) {
      // オーナーのメール取得
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', kouden.owner_id)
        .single();
      if (profileError || !profile?.email) continue;

      // メール送信
      await resend.emails.send({
        from: 'no-reply@kouden-app.com',
        to: profile.email,
        subject: '閲覧期限リマインダー',
        html: `<p>${message}</p>`,
      });

      // notification_typesID取得
      const { data: ntType, error: ntError } = await supabase
        .from('notification_types')
        .select('id')
        .eq('type_key', typeKey)
        .single();
      if (ntError || !ntType) continue;

      // アプリ内通知挿入
      await supabase.from('notifications').insert({
        user_id: kouden.owner_id,
        notification_type_id: ntType.id,
        data: { message },
        link_path: null,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
```

## 2. Vercel Cron 設定
ファイル: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 0 * * *"
    }
  ]
}
```

## 3. 環境変数
- `RESEND_API_KEY`（Resend APIキー）
- `SUPABASE_SERVICE_ROLE_KEY`（Supabase サービスロールキー）

## 4. 作業手順
1. `src/app/api/cron/send-reminders/route.ts` を作成し、上記コードを実装する
2. `.env.local` に必要な環境変数を追加する
3. `resend` と `@supabase/supabase-js` の依存があることを確認・インストールする
4. `vercel.json` にCron設定を追加し、コミット・プッシュする
5. ローカルで `curl http://localhost:3000/api/cron/send-reminders` による動作確認を行う
6. Vercel にデプロイし、DashboardでCronジョブの設定を有効化する
7. Cron実行後、ログとSupabaseデータベース内の通知レコードを確認する

## 5. テスト
- 未読リマインダー送信の流れを手動で検証
- メールが正しく届くか、`notifications` テーブルにレコードが追加されているか確認
- エラー発生時のハンドリングを確認 