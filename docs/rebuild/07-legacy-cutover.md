# 07. 旧アプリの停止と転送

[05 §6](./05-migration-plan.md#6-切り替え手順当日) の切り替え当日に、旧アプリ（`legacy/` の Next.js、Vercel）を止める・戻す・新ドメインへ転送する手順。実装は `legacy/src/lib/legacy-cutover.ts`（`legacy/src/middleware.ts` の先頭で呼ぶ）。

| 環境変数 | 値 | 挙動 |
|---|---|---|
| `MAINTENANCE_MODE` | `true` | 画面はメンテナンス表示、`/api/*` は JSON。どちらも 503（`Retry-After: 3600`）。Server Actions・運営者画面・OAuth のコールバック・Stripe Webhook・Cron（リマインダー通知の送信）もすべて 503 になる。Supabase には接続しない |
| `LEGACY_REDIRECT_ORIGIN` | `https://<新ドメイン>`（origin のみ） | 全パスを同じパス・クエリのまま 301 で転送する。切り戻しで取り消せるよう `Cache-Control: no-store` を付け、ブラウザに転送を保存させない。`MAINTENANCE_MODE` より優先 |

どちらも未設定（または `MAINTENANCE_MODE` が `true` 以外）なら挙動は変わらない。

## 手順

Vercel の環境変数は再デプロイしないと反映されない。どの操作も Production で「環境変数を変える → 最新のデプロイを Redeploy（ビルドキャッシュは使ってよい）」の 2 段で行う。

| 操作 | 環境変数 | 確認 |
|---|---|---|
| 停止（T-0:00） | `MAINTENANCE_MODE=true` を追加 | トップ・`/koudens` がメンテナンス表示で 503。`curl -i -X POST https://<旧ドメイン>/api/stripe/webhook` が 503 |
| 解除（中止時） | `MAINTENANCE_MODE` を削除 | ログインして香典帳を開ける |
| 転送（T+2:45） | `LEGACY_REDIRECT_ORIGIN=https://<新ドメイン>` を追加（`MAINTENANCE_MODE` は残す） | `curl -I https://<旧ドメイン>/koudens?x=1` が 301 で `Location: https://<新ドメイン>/koudens?x=1` |
| 転送の取り消し | `LEGACY_REDIRECT_ORIGIN` を削除 | `MAINTENANCE_MODE` が残っていればメンテナンス表示に戻る |

## 環境変数では止まらないもの

- **Stripe**: 停止中の Webhook は Stripe が最大 3 日間再送する。最終抽出の前に Stripe ダッシュボードで未配信のイベントがないかを確認し、一般公開前に Webhook の送信先を新アプリへ切り替える（301 は Stripe では失敗扱いになる）。
- **pg_cron**: `archive_free_koudens_daily`（`legacy/database/paid_implementation.sql`）は Supabase 内で毎日 0:00 UTC（9:00 JST）に `koudens.status` を更新する。メンテナンス時間がまたぐ場合は、本番に登録されているかを `select jobid, schedule, command, active from cron.job where jobname = 'archive_free_koudens_daily'` で確認して結果を控え、停止の直後に `select cron.alter_job(<jobid>, active := false)` で一時停止する（`cron.unschedule` はジョブを削除するので使わない）。中止して旧アプリを再開するときは `select cron.alter_job(<jobid>, active := true)` で戻し、同じ SELECT で `active` が `true` になったことと、翌日 `cron.job_run_details` に実行が記録されたことを確認する。
- **開いたままのタブ**: 停止前に開いていたタブは、ブラウザから Supabase へ直接 `notifications.is_read` と `kouden_entry_locks` を書き込める。どちらも移行対象外（[05 §3](./05-migration-plan.md#移行しないもの)）なので照合には影響しない。
- **旧 URL と新しい経路の対応**: 旧アプリのパスは v2 と異なる。旧 ID から新 ID への変換には D1 の `legacy_kouden_id` が必要なので、対応づけは旧アプリではなく v2 側（`apps/app/src/routes/legacy.tsx`）で受ける（Vercel の削除後に DNS で転送するときもパスはそのまま届くため）。v2 の旧 URL の転送は、利用者や切り戻しで行き先が変わるのですべて 302 にする。末尾に `/` が付いた旧パス（`/koudens/` など）も同じ転送先へ送る。クエリは同名の項目も含めて引き継ぎ、転送先で決まっている項目（`kind=choden` など）はそちらを優先する。
  - `/koudens/:旧ID` 以下と `/purchase/:旧ID`: ログインを求めたうえで（ログイン後は同じ旧 URL に戻る）、閲覧者がメンバーの香典帳を `legacy_kouden_id` で引き、`/k/:新ID` の対応する画面へクエリを保って転送する。`entries`・`offerings` → `/gifts`、`telegrams` → `/gifts?kind=choden`、`members`・`settings/members` → `/members`、`return_records` → `/returns`、`return_records/items`・`settings/return-items` → `/returns/settings`、`/purchase` とその他の `settings/*` → `/settings`、それ以外（概要・`statistics`・`archived`）→ `/k/:新ID`。見つからない・メンバーでない・削除中のときは `/?notice=legacy_missing`（一覧でお知らせを出す）
  - `/auth/login?redirectTo=…` → `/login?return_to=…`（戻り先は `safeReturnTo` で検査）。`/auth/callback` → `/login`（旧方式のコードは捨てる）
  - `/koudens` → `/`、`/koudens/new` → `/k/new`、`/profile`・`/settings` → `/account`、`/legal` → `/legal/tokushoho`（クエリは保つ）。`/pricing`・`/faq`・`/terms`・`/privacy` は同じパスのまま
  - v2 にない公開ページ（`/features`・`/guide`・`/manuals`・`/help`・`/contact`・`/changelogs`・`/milestones`・`/plans`・`/promotions`・`/developers` とその下）→ `/`
  - `/invitations/:token`・`/invitation-error`: 招待は移行しない（[05 §3](./05-migration-plan.md#移行しないもの)）ので、410 で招待リンクの作り直しを案内する
  - `/api/*` など上記以外は 404
- **画像**: `src/middleware.ts` の matcher から外れている画像（`.png` など）と `_next/static` は転送されない。
- **Vercel の削除後**: [05 §7](./05-migration-plan.md#7-切り替え後) で Vercel プロジェクトを消した後は、DNS 側（Cloudflare の Redirect Rules など）で同じ 301 を続ける。

## 事前の試行

本番の前に Preview 環境（環境変数を Preview だけに設定）で、停止 → 解除 → 転送 → 取り消しを一通り行い、上の「確認」がすべて通ることを確かめる（otomatty/kouden#196）。
