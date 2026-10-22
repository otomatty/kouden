あなたは優秀な AI コーディングエージェントです。
以下のガイドラインに則って、香典帳（Kouden）プロジェクトの実装作業を行ってください。

---

## 概要

香典帳（Kouden）は、葬儀・法要における香典・供物の記録・管理を行う Web アプリケーションです。
Cloudflare Workers 上で動き、https://kouden.app で公開しています（2026-10-21）。

- 開発・コマンド・デプロイの手順: [`README.md`](README.md)
- 設計（要件・ドメインモデル・アーキテクチャ・決定事項）: [`docs/rebuild/`](docs/rebuild/README.md)
- 旧アプリ（Next.js + Supabase）: [`legacy/`](legacy/)。停止済みで、参照用に残している。保守・CI・デプロイはしないので、明示的に頼まれない限り変更しない

---

## 技術スタック

| カテゴリ     | 技術                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| ランタイム   | Cloudflare Workers（D1 / Durable Objects / R2 / Email Service）                                        |
| CLI・ビルド  | `cf`（ベータ）+ Vite                                                                                   |
| 画面         | Hono JSX（サーバー側で HTML 生成）+ htmx + Tailwind CSS                                                |
| 認証         | Google OIDC（自前実装）+ D1 のセッション。運営者画面は Cloudflare Access                               |
| 決済         | Stripe（SDK を使わず REST API を呼ぶ）                                                                 |
| 言語・ツール | TypeScript / Bun（ワークスペース）/ Oxlint / oxfmt / Vitest（`@cloudflare/vitest-plugin`）/ Playwright |

---

## ディレクトリ

| パス                           | 内容                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `apps/app/`                    | 利用者向け Worker（`kouden-app`）と香典帳の Durable Object（`KoudenLedger`、1 冊 = 1 DO） |
| `apps/admin/`                  | 運営者画面（`kouden-admin`）。Access の背後に置き、D1 だけを使う                          |
| `packages/domain/`             | 業務ルール（入力検証・権限・金額の按分など。純粋な TypeScript）                           |
| `packages/ui/`                 | app と admin で共有するクラス名と色・フォント                                             |
| `tools/migrate-from-supabase/` | 旧アプリのデータの変換・投入・照合 CLI（移行は 2026-10-20 に完了）                        |
| `tools/screen-catalog/`        | 全画面をサンプルデータで状態ごとに描画する画面カタログ（`bun run catalog`）               |
| `e2e/`                         | Playwright の E2E とアクセシビリティの検査                                                |
| `docs/rebuild/`                | 設計ドキュメント                                                                          |
| `legacy/`                      | 旧アプリ（参照用）                                                                        |

---

## コーディング原則

- 設計の決定は `docs/rebuild/01-decisions.md`（ADR）に従う。方針を変える場合は ADR を更新する
- 権限は `packages/domain/src/permissions.ts` の `can(role, action)` で判定し、香典帳への到達は D1 のメンバーシップで確かめる（D1 / DO はブラウザに公開しないので RLS はない）
- 環境ごとの設定（Worker 名・ドメイン・D1・Access など）は `apps/*/deploy.settings.ts` に集約する。`deployBlockers` が仮の値や危険な設定のデプロイを止める
- DO のスキーマは `apps/app/src/ledger/schema.ts` の `MIGRATIONS` の末尾に追加する（適用済みの要素は変更しない）。D1 は `apps/app/migrations/` に連番で追加する
- 本番には実際の利用者のデータがある。DO・D1 の構造を変える変更は、staging で確かめてから本番にデプロイする
- 秘密情報（API キー・トークン・接続文字列）をコード・ログ・Issue・PR に書かない

---

## 検証

リポジトリの直下で実行する。

```bash
bun install
bun run fmt:check
bun run lint
bun run typecheck
bun run test
```

E2E は `bun run e2e`（詳しくは README）。CI（`.github/workflows/v2-ci.yml`）も同じ検査を行う。

## デプロイ

GitHub Actions の「v2 Deploy」を手動で実行する（`staging` / `production`）。production は承認と `main` ブランチが必要。

## コミットメッセージ

Conventional Commits 形式を使用する。

```
feat(app): 供物の写真を添付できるようにする
fix(admin): 検索結果の並び順を直す
docs: AGENTS.md を更新する
```

## Windows での注意

- `apps/app` の `bun run dev` は Windows の bun で `&` を使えず失敗する。`bun run serve` で起動する
- PowerShell 5.1 でスクリプトを書くときは UTF-8（BOM 付き）で保存し、秘密は `Read-Host -AsSecureString` で入力する
