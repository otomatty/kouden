あなたは優秀なAIコーディングエージェントです。
以下のガイドラインに則って、香典帳（Kouden）プロジェクトの実装作業を行なってください。

---

## 概要

香典帳（Kouden）は、葬儀・法要における香典・供物の記録・管理を行う **Next.js 15 App Router** の Web アプリケーションです。

本リポジトリは **Server Actions 中心のモノリス構成**です。ビジネスロジックは `src/app/_actions` にドメイン単位で配置し、UI は `src/app` のルートグループと `src/components` で構成します。

詳細なコーディング規約は `.cursor/rules/` 配下のルールファイルを参照してください。

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| スタイル | Tailwind CSS, shadcn/ui |
| 状態管理 | Jotai (`src/store`) |
| バックエンド | Supabase (PostgreSQL) |
| バリデーション | Zod (`src/schemas`) |
| ランタイム / パッケージマネージャー | Bun |
| Linter / Formatter | Biome |
| テスト | Vitest (単体), Playwright (E2E) |
| ホスティング | Vercel |

---

## ディレクトリ構造

```plaintext
.
├── database/                    # PostgreSQL テーブル定義・マイグレーション
│   ├── *.sql                    # テーブル定義 (テーブル名.sql)
│   └── migrations/              # マイグレーション SQL
│
├── docs/                        # プロジェクト開発ドキュメント
│   ├── database/                # DB 構造調査クエリ
│   ├── developments/            # 開発メモ・設計資料
│   └── security/                # セキュリティ関連
│
├── e2e/                         # Playwright E2E テスト
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (protected)/         # 認証必須ページ
│   │   ├── (public)/            # 公開ページ
│   │   ├── (system)/            # 管理画面
│   │   ├── _actions/            # Server Actions (ドメイン別)
│   │   │   ├── koudens/         # 香典帳 CRUD
│   │   │   ├── return-records/  # お返し記録
│   │   │   ├── offerings/       # 供物
│   │   │   └── ...
│   │   └── api/                 # API Routes (複雑な API)
│   │
│   ├── components/              # React コンポーネント
│   │   ├── ui/                  # shadcn/ui コンポーネント
│   │   └── custom/              # カスタム共通コンポーネント
│   │
│   ├── schemas/                 # Zod バリデーションスキーマ
│   ├── types/                   # TypeScript 型定義
│   ├── lib/                     # 共通ライブラリ (Supabase クライアント, エラー処理等)
│   ├── hooks/                   # カスタムフック
│   ├── utils/                   # ユーティリティ関数
│   ├── store/                   # Jotai atoms (クライアント状態)
│   ├── config/                  # アプリ設定
│   ├── context/                 # React Context
│   └── docs/                    # ユーザー向けドキュメント (マニュアル等)
│
└── .cursor/rules/               # AI・開発者向けコーディングルール
```

---

## レイヤーの責務

### `src/app/_actions` — Server Actions

- ビジネスロジックの中心。シンプルな CRUD はここに配置する
- ドメイン単位でサブディレクトリに分割する (例: `koudens/`, `return-records/`)
- ファイル先頭に `"use server"` を記述する
- Supabase クライアントは `@/lib/supabase/server` または `@/lib/supabase/admin` から取得する
- エラーは `@/lib/errors` の `ActionResult` / `withActionResult` パターンで返す
- テストは `__tests__/` または同一ディレクトリの `*.test.ts` に配置する

### `src/app/api` — API Routes

- Webhook、外部連携、ストリーミングなど Server Actions に不向きな処理を担当する
- Stripe Webhook、CSRF トークン発行、Cron ジョブ等がここに配置される

### `src/schemas` — バリデーション

- Zod スキーマをドメイン単位で定義する
- フォーム入力のバリデーションと型推論 (`z.infer`) に使用する

### `src/lib` — 共通ライブラリ

- Supabase クライアント (`lib/supabase/`)
- エラーハンドリング (`lib/errors.ts`)
- ロガー (`lib/logger.ts`)
- セキュリティ関連ユーティリティ

### `src/components` — UI コンポーネント

- `components/ui/`: shadcn/ui ベースのプリミティブ
- `components/custom/`: プロジェクト固有の再利用コンポーネント
- ページ固有のコンポーネントは `src/app/(protected)/<route>/_components/` にコロケーションする

### `src/store` — クライアント状態

- Jotai atoms で UI 状態を管理する
- サーバー状態は Supabase 経由で取得し、必要に応じてクライアントでキャッシュする

### `database/` — データベース定義

- テーブル定義は `テーブル名.sql` 形式
- RLS (Row Level Security) ポリシーを必ず設定する
- マイグレーションは `database/migrations/` に配置する

---

## コーディング原則

### ロジックと UI の分離

- コンポーネントは表示に専念し、データ操作は Server Actions に委譲する
- 共通ロジックは `src/hooks` (React 依存) または `src/utils` (純粋関数) に配置する

### Server Actions と API Routes の使い分け

| 用途 | 配置先 |
|------|--------|
| フォーム送信、CRUD | `src/app/_actions` |
| Webhook、外部 API 連携 | `src/app/api` |
| 認証が必要な操作 | Server Actions 内でセッションから `auth.getUser()` で取得 |

### エラーハンドリング

- Server Actions は `ActionResult<T>` 型で成功/失敗を返す
- クライアントから渡された `userId` は信用せず、必ずセッションから取得する
- Supabase エラーは `KoudenError` でラップし、ユーザーにわかりやすいメッセージを返す

### 認証・認可

- 認証: Supabase Auth (Google OAuth)
- 認可: RLS ポリシー + アプリ層の権限チェック (`permissions.ts`)
- 管理画面: `(system)/admin` ルートグループ

---

## テスト

| 種類 | フレームワーク | 配置場所 |
|------|--------------|---------|
| 単体テスト | Vitest | 対象ファイルと同ディレクトリの `*.test.ts` |
| E2E テスト | Playwright | `e2e/*.spec.ts` |

- テストは Arrange / Act / Assert パターンで記述する
- Server Actions のテストでは Supabase クライアントをモックする
- 実行: `bun run test -- --run`

詳細は `.cursor/rules/testings-guideline.mdc` を参照。

---

## AI エージェントへの作業指示

機能追加・修正時は、以下の手順で作業してください。

### 1. 影響範囲の特定

変更対象のドメインに対応する `_actions` サブディレクトリを特定する。

```
例: お返し記録の修正 → src/app/_actions/return-records/
例: 香典帳 CRUD → src/app/_actions/koudens/
```

### 2. 関連ファイルの確認

| 変更内容 | 確認・更新するファイル |
|---------|---------------------|
| バリデーション追加 | `src/schemas/<domain>.ts` |
| 型定義追加 | `src/types/<domain>.ts` |
| DB スキーマ変更 | `database/<table>.sql`, `database/migrations/` |
| UI 変更 | `src/app/(protected)/<route>/`, `src/components/` |
| クライアント状態 | `src/store/<domain>.ts` |

### 3. 実装

1. 必要に応じて Zod スキーマ・型定義を追加/更新
2. Server Action を実装 (既存パターンに合わせる)
3. UI コンポーネントを更新
4. テストを追加・更新

### 4. 検証

```bash
export PATH="$HOME/.bun/bin:$PATH"
bun run test -- --run    # 単体テスト
bun run build            # ビルド確認
```

### コミットメッセージ

Conventional Commits 形式を使用する。詳細は `.cursor/rules/commit-message-rule.mdc` を参照。

```
feat(koudens): 香典帳の複製機能を追加
fix(return-records): 一括更新時のバリデーションエラーを修正
docs: AGENTS.md のアーキテクチャ記述を更新
```

---

## 関連ルールファイル

| ルール | 内容 |
|--------|------|
| `.cursor/rules/project-stack.mdc` | 技術スタック |
| `.cursor/rules/logic-style.mdc` | Server Actions / API Routes の配置 |
| `.cursor/rules/components-style.mdc` | コンポーネントのコーディングスタイル |
| `.cursor/rules/database-rules.mdc` | DB 設計・RLS |
| `.cursor/rules/error-handling-guidelines.mdc` | エラーハンドリング |
| `.cursor/rules/testings-guideline.mdc` | テスト方針 |
| `.cursor/rules/commit-message-rule.mdc` | コミットメッセージ規約 |

---

## Cursor Cloud specific instructions

### 概要

香典帳（Kouden）は葬儀・法要における香典管理のための Next.js 15 Webアプリケーションです。ランタイム/パッケージマネージャーに Bun、バックエンドに Supabase、リンターに Biome を使用しています。

### コマンド一覧

| タスク | コマンド |
|--------|---------|
| 依存関係インストール | `bun install` |
| 開発サーバー起動 | `bun dev`（ポート 8788） |
| ビルド | `bun run build` |
| リント | `bun run lint`（Biome） |
| ユニットテスト | `bun run test -- --run` |
| Storybook | `bun run storybook`（ポート 6006） |

### 環境セットアップの注意点

- Bun が `$PATH` に含まれている必要があります。アップデートスクリプトにより `~/.bun/bin/bun` にインストールされます。コマンド実行前に `export PATH="$HOME/.bun/bin:$PATH"` を実行してください。
- `.env.local` ファイルが必要です。`.env.example` からコピーし、最低限 `CSRF_SECRET`（`openssl rand -hex 32` で生成）、`STRIPE_SECRET_KEY`（プレースホルダー `sk_test_placeholder` でもビルド可能）、`GOOGLE_SERVICE_ACCOUNT_EMAIL` を設定してください。また、README.md に記載の Supabase 認証情報（`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`）も設定が必要です。
- `bun run lint` はプロジェクト既存のリント違反（約441件）により終了コード 1 で終了します。内訳は `noConsoleLog` や命名規則に関する警告・エラーです。これらは既知の技術的負債であり、明示的に依頼されない限り修正不要です。終了コード 1 は想定通りの動作です。
- ユニットテストは Vitest で実行します（`bun run test -- --run`）。全366テストがパスします。`survey-modal` テストは設計上スキップされています。
- Supabase 環境変数は必須です。`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` が未設定の場合、`src/lib/supabase/middleware.ts` がモジュールロード時に throw するため、アプリが正しく起動・動作しません。プレースホルダー値でもビルドと起動は可能ですが、認証やデータ機能には有効な認証情報が必要です。
- `UPSTASH_REDIS_REST_URL` または `UPSTASH_REDIS_REST_TOKEN` が未設定の場合、もしくは Upstash への通信が失敗した場合、レート制限はインメモリ `Map` にフォールバックします。ローカル開発では問題ありません。
