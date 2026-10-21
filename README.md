# 香典帳（Kouden）

葬儀・法要の香典・供物を記録・管理する Web アプリです。Cloudflare Workers 上で動き、https://kouden.app で公開しています。

- 設計（要件・ドメインモデル・アーキテクチャ・ADR）: [`docs/rebuild/`](docs/rebuild/README.md)
- 旧アプリ（Next.js + Supabase）: [`legacy/`](legacy/)。停止済みで、参照用に残しています

## ディレクトリ

| パス                           | 内容                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `apps/app/`                    | 利用者向け Worker（`kouden-app`）と香典帳の Durable Object（`KoudenLedger`）  |
| `apps/admin/`                  | 運営者画面（`kouden-admin`）。Cloudflare Access の背後に置き、D1 だけを使う   |
| `packages/domain/`             | 業務ルール（入力検証・権限・金額の按分など）                                  |
| `packages/ui/`                 | app と admin で共有するクラス名と色・フォント                                 |
| `tools/migrate-from-supabase/` | 旧アプリからのデータ移行 CLI（[手順](tools/migrate-from-supabase/README.md)） |
| `e2e/`                         | Playwright の E2E とアクセシビリティの検査                                    |

## ローカル開発

必要なもの: Bun 1.4 以上、Node.js 22 以上（`cf` が使う）

```sh
bun install

cd apps/app
cp .dev.vars.example .dev.vars   # SESSION_SECRET に `openssl rand -hex 32` の値を入れる
bun run db:migrate:local
bun run dev                      # http://localhost:5173（Windows は bun run serve）
```

運営者画面は別のターミナルで `cd apps/admin && bun run dev`（http://localhost:5174）。`apps/app` と同じローカル D1 を使い、`deploy.settings.ts` の `devEmail` を運営者として扱います。2 つの `cf dev` が同じ SQLite ファイルを開くので、同時に書き込むと `database is locked`（SQLITE_BUSY）になることがあります（ローカルだけの現象です）。

Google ログインを試すときは、`.dev.vars` の `GOOGLE_CLIENT_SECRET` と `apps/app/deploy.settings.ts` の `development` の `googleClientId` を設定します（リダイレクト URI は `http://localhost:5173/auth/google/callback`）。

## コマンド（リポジトリの直下）

| コマンド                       | 内容                                       |
| ------------------------------ | ------------------------------------------ |
| `bun run test`                 | テスト（Workers ランタイム上で D1 を含む） |
| `bun run typecheck`            | 型チェック                                 |
| `bun run lint` / `bun run fmt` | Oxlint / oxfmt                             |
| `bun run build`                | 本番用ビルド                               |
| `bun run e2e`                  | E2E とアクセシビリティの検査               |

E2E は初回に `cd e2e && bunx playwright install chromium` を実行します。5173・5174 番を使うので、`bun run dev` を止めてから実行してください。

## スキーマの変更

- D1: `apps/app/migrations/` に連番で追加する
- DO: `apps/app/src/ledger/schema.ts` の `MIGRATIONS` の末尾に追加する（適用済みの要素は変更しない）

本番には利用者のデータがあるので、staging で確かめてから本番にデプロイします。

## デプロイ

GitHub Actions の「v2 Deploy」を手動で実行します（`staging` / `production`）。production は承認と `main` ブランチが必要です。D1 のマイグレーションはデプロイの中で自動的に適用されます（初回は D1 の作成後に適用）。環境ごとの設定は `apps/*/deploy.settings.ts` にあります。

GitHub Environments に登録するシークレット: `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`GOOGLE_CLIENT_SECRET`、`SESSION_SECRET`、`STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`

Stripe の Webhook は `https://<ドメイン>/webhooks/stripe` に、`checkout.session.completed`・`checkout.session.async_payment_succeeded`・`checkout.session.async_payment_failed`・`charge.refunded` を送ります。

### Cloudflare Access

Zero Trust で次の Self-hosted アプリケーションを作り、運営者のメールアドレスだけを許可します。

- 運営者画面: `admin.kouden.app` と `kouden-admin-staging.saedgewell.workers.dev`。AUD は `apps/admin/deploy.settings.ts` の `access` に設定する
- staging の利用者向けアプリ: `kouden-app-staging.saedgewell.workers.dev`。AUD は `apps/app/deploy.settings.ts` の staging の `access` に設定する

チームのドメイン（`<team>.cloudflareaccess.com`）も同じ `access` に設定します。設定が欠けていると `deployBlockers` がデプロイを止めます。

staging で決済を有効にするときは、`kouden-app-staging.saedgewell.workers.dev/webhooks/stripe` を別のアプリケーションにして Bypass（Everyone）のポリシーを付けます（Worker 側の除外だけでは Access を通れません）。

## `cf`（ベータ）の注意点

詳細は [ADR-T15](docs/rebuild/01-decisions.md#adr-t15-cli-は-cfベータ-vite-を使う)。

- ログは Workers Logs のダッシュボードか `npx wrangler tail <Worker 名>` で見る
- シークレットは `cf deploy --secrets-file` で渡す
- `cloudflare.config.ts` に binding を追加したら、`apps/app/vitest.config.ts` にも追加する
- ローカルの D1 マイグレーションは `cf d1 migrations apply --local` ではなく `bun run db:migrate:local` を使う
