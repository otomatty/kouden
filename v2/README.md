# 香典帳 v2（Cloudflare 版）

Cloudflare Workers 上に作り直している新しい香典帳です。設計は [`docs/rebuild/`](../docs/rebuild/README.md) を参照してください。
切り替えまでは、リポジトリ直下の旧実装（Next.js + Supabase）と同居しています。

| 項目        | 技術                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------- |
| ランタイム  | Cloudflare Workers（D1 / Durable Objects / R2）                                                     |
| CLI・ビルド | [`cf`](https://developers.cloudflare.com/cf/)（ベータ）+ Vite（`@cloudflare/vite-plugin` 2.0 beta） |
| 画面        | Hono JSX（サーバー側で HTML 生成）+ htmx + Tailwind CSS                                             |
| 認証        | Google OIDC（自前実装）+ D1 のセッション                                                            |
| 開発ツール  | Bun / Oxlint / oxfmt / TypeScript 7 / Vitest + `@cloudflare/vitest-plugin`                          |

## ディレクトリ

```
v2/
├── apps/app/          # 利用者向け Worker（kouden-app）と香典帳の DO（KoudenLedger）
│   └── src/
│       ├── ledger/    # KoudenLedger: 香典帳 1 冊分の SQLite（スキーマ・マイグレーション・RPC）
│       ├── kouden/    # D1 の香典帳・メンバーシップ
│       ├── routes/    # 画面（pages: 公開ページ、koudens: 香典帳の中）
│       └── views/     # JSX
├── apps/admin/        # 運営者画面（kouden-admin）。Cloudflare Access の背後に置き、D1 だけを使う（DO には接続しない）
├── packages/domain/   # 業務ルール（入力検証・権限・検索の正規化・金額の按分など。純粋な TypeScript）
├── packages/ui/       # app と admin で共有するクラス名（ui.ts）と色・フォント（theme.css）
├── tools/migrate-from-supabase/  # 旧アプリ（Supabase）の変換・投入・照合 CLI（prepare / import / verify）
└── e2e/               # Playwright の E2E とアクセシビリティの検査（axe）
```

## ローカル開発

データ移行は [移行 CLI の手順](tools/migrate-from-supabase/README.md) を参照してください。Supabase コネクタの抽出結果を入力に使い、D1・DO・R2 への投入後に JSON / Markdown の照合レポートを作成します。

必要なもの: Bun 1.4 以上、Node.js 22 以上（`cf` が使う）

```sh
cd v2
bun install

cd apps/app
cp .dev.vars.example .dev.vars   # SESSION_SECRET に `openssl rand -hex 32` の値を入れる
bun run db:migrate:local         # ローカル D1 にマイグレーションを適用
bun run dev                      # http://localhost:5173
```

運営者画面は別のターミナルで起動します（`apps/app` と同じローカル D1 を見ます。Access は通さず、`deploy.settings.ts` の `devEmail` を運営者として扱います）。2 つの `cf dev` が同じ SQLite ファイルを開くため、両方で同時に書き込むと `database is locked`（SQLITE_BUSY）になることがあります（ローカルだけの現象です）。

```sh
cd v2/apps/admin
bun run dev                      # http://localhost:5174
```

Google ログインを試すには、OAuth クライアントの値を `.dev.vars` の `GOOGLE_CLIENT_SECRET` と `apps/app/deploy.settings.ts` の `development` の `googleClientId` に設定してください（承認済みのリダイレクト URI に `http://localhost:5173/auth/google/callback` を追加しておく）。

## よく使うコマンド（`v2/` で実行）

| コマンド                       | 内容                                                                 |
| ------------------------------ | -------------------------------------------------------------------- |
| `bun run test`                 | 全パッケージのテスト（Workers ランタイム上で D1 を含めて実行）       |
| `bun run typecheck`            | 型チェック（`cf workers types` で binding の型を生成してから `tsc`） |
| `bun run lint` / `bun run fmt` | Oxlint / oxfmt                                                       |
| `bun run build`                | 本番用ビルド（`apps/app/.cloudflare/output`）                        |
| `bun run e2e`                  | E2E とアクセシビリティの検査（下記）                                 |

`apps/app` で実行するもの:

| コマンド                               | 内容                                                             |
| -------------------------------------- | ---------------------------------------------------------------- |
| `bun run db:migrate:local`             | ローカル D1 にマイグレーションを適用                             |
| `bun run assets`                       | Tailwind のビルドと htmx のコピー（`dev` / `build` で自動実行）  |
| `bun run db:migrate -- --mode staging` | ステージングの D1 にマイグレーションを適用（要 `cf auth login`） |
| `bun run deploy -- --mode staging`     | ステージングへデプロイ（通常は GitHub Actions から）             |

D1 のマイグレーションファイルは `cf d1 migrations create` で作成するか、`apps/app/migrations/` に連番で追加します。
DO（KoudenLedger）のスキーマは `apps/app/src/ledger/schema.ts` の `MIGRATIONS` の末尾に追加します（各 DO が次に呼ばれたときに適用されます。適用済みの要素は変更しないでください）。

## E2E（`v2/e2e`）

Playwright で、利用者向けアプリ（:5173）と運営者画面（:5174）の `cf dev` を起動して画面を操作し、各画面を axe（WCAG 2.1 A/AA）で検査します。

```sh
cd v2/e2e
bunx playwright install chromium   # 初回のみ
bun run e2e                        # = scripts/prepare.ts → playwright test
```

- `scripts/prepare.ts` が専用の保存先（`e2e/.state`）を作り直し、D1 にマイグレーションを当てて、`tests/users.ts` の利用者とセッションを入れます。テストはセッションの Cookie を付けてログイン済みとして操作します（Google のログインは通しません）。開発中のデータ（`apps/app/.cloudflare/state`）には触れません
- 5173・5174 番を使うため、`bun run dev` を止めてから実行してください
- 手元の Chromium を使う場合は `PLAYWRIGHT_CHROMIUM_PATH` に実行ファイルのパスを入れます
- 失敗したテストのトレースは `e2e/test-results/` に残ります（`bunx playwright show-trace …`）

## 公開までに必要な作業（運営者が行うもの）

M0 のコードは揃っていますが、以下は Cloudflare・Google・GitHub のアカウントでの作業が必要です。

1. **ドメインの取得**: Cloudflare Registrar で取得し、`apps/app/deploy.settings.ts` の `DOMAIN` を置き換える。
2. **Google OAuth クライアントの作成**（Google Cloud Console）:
   - 種類: ウェブ アプリケーション
   - 承認済みのリダイレクト URI: `https://<ドメイン>/auth/google/callback`、`https://staging.<ドメイン>/auth/google/callback`、`http://localhost:5173/auth/google/callback`
   - クライアント ID を `apps/app/deploy.settings.ts` の各 mode の `googleClientId` に設定する
   - 同意画面のブランド確認のため、取得したドメインを Search Console で所有確認する
3. **Cloudflare の API トークン作成**: 権限は Workers Scripts・D1・Workers Routes / Custom Domains の編集。
4. **GitHub の Environments（`staging` / `production`）にシークレットを登録**:
   - `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SESSION_SECRET`（`openssl rand -hex 32`。環境ごとに別の値）
   - `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`（下の 6.）
   - `production` には承認者（Required reviewers）を設定する
5. **ステージングを Cloudflare Access で保護**: `staging.<ドメイン>` を Access アプリケーションにし、開発者のメールのみ許可する。
6. **運営者画面を Cloudflare Access で保護**: Zero Trust で `admin.<ドメイン>` と `admin-staging.<ドメイン>` を Self-hosted アプリケーションにし、ポリシーで運営者のメールアドレスだけを許可する。チームのドメイン（`<team>.cloudflareaccess.com`）と各アプリケーションの AUD タグを `apps/admin/deploy.settings.ts` の `access` に設定する（設定するまで `deployBlockers` がデプロイを止める）
7. **Stripe の設定**（ステージングはテストモード、本番はライブモード）:
   - Webhook のエンドポイント: `https://<ドメイン>/webhooks/stripe`。送るイベントは `checkout.session.completed`・`checkout.session.async_payment_succeeded`・`checkout.session.async_payment_failed`・`charge.refunded`。表示される署名シークレット（`whsec_...`）を `STRIPE_WEBHOOK_SECRET` に登録する
   - シークレットキー（`sk_...`。制限付きキーなら Checkout Sessions の書き込み権限）を `STRIPE_SECRET_KEY` に登録する
   - 「カスタマーメール」で支払い成功時の領収書の送信を有効にする（E9-3）
   - ローカルで試す場合は `.dev.vars` にテストモードのキーを入れ、`stripe listen --forward-to localhost:5173/webhooks/stripe` が表示する `whsec_...` を `STRIPE_WEBHOOK_SECRET` に入れる
8. **デプロイ**: GitHub Actions の「v2 Deploy」を手動実行する（利用者向けアプリの後に運営者画面もデプロイされる）。初回は D1 がデプロイ時に作成され、続けてマイグレーションが適用される。

## `cf`（ベータ）の注意点

ベータ版のため、いくつか回避策を入れています（詳細は [ADR-T15](../docs/rebuild/01-decisions.md#adr-t15-cli-は-cfベータ-vite-を使う)）。

- ログのリアルタイム表示は `cf` にまだないので、Workers Logs のダッシュボードか `npx wrangler tail <Worker 名>` を使う。
- シークレットは `cf deploy --secrets-file` で渡す（`cf` に 1 件だけ登録するコマンドがまだない）。
- テスト用の binding は `apps/app/vitest.config.ts` に別途宣言している。`cloudflare.config.ts` に binding を追加したら、こちらにも追加する（不一致はテスト起動時にエラーになる）。
- `cf d1 migrations apply --local` は応答が返らないことがあるため、ローカルは `bun run db:migrate:local` を使う。
