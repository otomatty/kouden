# 香典帳 再構築設計（Cloudflare 版）

現行の Next.js + Supabase + Vercel 構成を廃止し、Cloudflare Workers 上に全面的に作り直すための設計ドキュメント群です。

| # | ドキュメント | 内容 |
|---|---|---|
| 01 | [決定事項 (ADR)](./01-decisions.md) | 技術・プロダクト上の意思決定とその理由 |
| 02 | [ユーザーストーリー](./02-user-stories.md) | ペルソナ、エピック、ストーリーと受け入れ条件 |
| 03 | [ドメインモデル](./03-domain-model.md) | D1 / Durable Object のスキーマ、変更ログ、不変条件 |
| 04 | [アーキテクチャ](./04-architecture.md) | Worker 構成、認証、リアルタイム、画面技術、運用 |
| 05 | [移行計画](./05-migration-plan.md) | 実装マイルストーン、Supabase からのデータ移行、切り替え手順 |
| 06 | [移行リハーサルの記録（2026-10-13）](./06-migration-rehearsal-20261013.md) | 一時環境への実データ投入・再投入・自動照合と削除確認 |

実装は [`v2/`](../../v2/README.md) にある。

## 一行サマリー

**Hono（JSX SSR + htmx）on Cloudflare Workers。香典帳 1 冊 = 1 Durable Object（SQLite）、横断データは D1、ファイルは R2。認証は Google OIDC を自前実装、運営者画面のみ Cloudflare Access。**

## 未確定事項

実装を止めずに後から決められるもの。決まり次第このリストから外し、該当ドキュメントを更新する。

| 項目 | 現状 | 決める時期 |
|---|---|---|
| ドメイン名 | Cloudflare Registrar で新規取得予定。ドキュメント内では `example.jp` と表記 | M0 着手前 |
| Excel 生成ライブラリ | Workers 上で動作するものを PoC で選定（[04 §8](./04-architecture.md#8-帳票出力)） | M4 着手前 |
| Google OAuth のブランド確認 | 取得ドメインで Search Console 所有確認が必要 | M0 |
| Cloudflare Email Service | ベータ版。GA 前に問題があれば Resend に差し替え（`Mailer` で抽象化済み） | M3 |
| `cf` CLI / Vite plugin 2.0 | ベータ版。回避策と撤退条件は [ADR-T15](./01-decisions.md#adr-t15-cli-は-cfベータ-vite-を使う) | 正式版リリース時 |
