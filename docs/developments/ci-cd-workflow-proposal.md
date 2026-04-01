# CI/CDワークフロー整備提案

## 概要

香典帳アプリの保守性向上のため、GitHub Actionsを使用したCI/CDワークフローの整備を提案します。

## 現在の状況

### 既存のワークフロー
- ✅ `sync-to-oss.yml`: OSSリポジトリへの同期（mainブランチのみ）

### 技術スタック
- **フレームワーク**: Next.js 15.3.3
- **言語**: TypeScript (strict mode)
- **Linter/Formatter**: Biome
- **テスト**: Vitest, Jest, Playwright, Storybook
- **デプロイ**: Vercel
- **パッケージマネージャー**: Bun（開発）/ npm（CI）

### 利用可能なスクリプト
- `lint`: Biome check
- `test`: Vitest実行
- `test:coverage`: カバレッジ付きテスト
- `build`: Next.jsビルド
- `build-storybook`: Storybookビルド

## 提案するワークフロー

### 1. PRチェックワークフロー（最重要・優先度: 高）

**ファイル名**: `.github/workflows/pr-checks.yml`

**目的**: プルリクエスト作成時にコード品質を保証

**実行タイミング**:
- プルリクエスト作成時
- プルリクエスト更新時（push）

**実行内容**:
1. **Lintチェック**（Biome）
   - コードスタイルの検証
   - エラーがあればPRをブロック

2. **Type Check**（TypeScript）
   - 型エラーの検証
   - エラーがあればPRをブロック

3. **テスト実行**（Vitest）
   - ユニットテストの実行
   - 失敗があればPRをブロック

4. **ビルドチェック**（Next.js）
   - 本番ビルドが成功するか確認
   - 失敗があればPRをブロック

**対象ブランチ**: `main`、`develop` ブランチへのPR

---

### 2. テストカバレッジレポート（優先度: 中）

**ファイル名**: `.github/workflows/test-coverage.yml`

**目的**: テストカバレッジの可視化と推移の追跡

**実行タイミング**:
- プルリクエスト作成時
- プルリクエスト更新時（push）

**実行内容**:
1. テストカバレッジの収集
2. カバレッジレポートの生成
3. PRコメントへのカバレッジ結果の投稿
4. カバレッジの閾値チェック（オプション）

**対象ブランチ**: すべてのPR

**必要な設定**:
- `@vitest/coverage-v8` パッケージのインストール
- Codecov または Coveralls のアカウント設定（オプション）

---

### 3. デプロイワークフロー（優先度: 高）

**ファイル名**: `.github/workflows/deploy.yml`

**目的**: ブランチごとの自動デプロイ

**実行タイミング**:
- `develop`ブランチへのpush → プレビュー環境へデプロイ
- `main`ブランチへのpush → 本番環境へデプロイ

**実行内容**:
1. **developブランチ**
   - Vercel Preview環境へのデプロイ
   - デプロイURLをPRにコメント

2. **mainブランチ**
   - Vercel Production環境へのデプロイ
   - デプロイ成功通知（Slack/Discord、オプション）

**注意**: Vercelの自動デプロイ機能と重複する可能性があるため、Vercelの設定を確認してから実装

---

### 4. Storybookビルドチェック（優先度: 低）

**ファイル名**: `.github/workflows/storybook-build.yml`

**目的**: Storybookのビルドが成功するか確認

**実行タイミング**:
- プルリクエスト作成時
- プルリクエスト更新時（push）
- Storybook関連ファイルの変更時のみ実行（パフォーマンス最適化）

**実行内容**:
1. Storybookのビルド
2. Storybookのテスト実行（`npm run test-storybook`）
3. ビルド成果物のアップロード（Artifact）
4. Chromaticへのデプロイ（オプション）

**対象ブランチ**: すべてのPR

---

### 5. セキュリティチェック（優先度: 中）

**ファイル名**: `.github/workflows/security.yml`

**目的**: 依存関係の脆弱性チェック

**実行タイミング**:
- プルリクエスト作成時
- 週次スケジュール（毎週月曜日）

**実行内容**:
1. **npm audit**による脆弱性スキャン
2. **Dependabot**の統合（GitHubの機能）
3. セキュリティアラートの通知（オプション）

**対象ブランチ**: すべてのPR

---

### 6. データベースマイグレーションチェック（優先度: 中）

**ファイル名**: `.github/workflows/db-migration-check.yml`

**目的**: Supabaseマイグレーションの検証

**実行タイミング**:
- プルリクエスト作成時
- `supabase/migrations/**` または `database/**` の変更時

**実行内容**:
1. Supabase CLIのセットアップ
2. マイグレーションファイルの構文チェック
3. ローカル環境でのマイグレーション実行テスト（オプション）

**必要な設定**:
- SupabaseプロジェクトID
- Supabaseアクセストークン（Secrets）

---

## 実装優先順位

### Phase 1: 基本CI（即座に実装）
1. ✅ PRチェックワークフロー（Lint、Type Check、Test、Build）
2. ✅ テストカバレッジレポート

### Phase 2: デプロイ自動化（1週間以内）
3. ✅ デプロイワークフロー（Vercel連携の確認後）

### Phase 3: 品質向上（2週間以内）
4. ✅ セキュリティチェック
5. ✅ データベースマイグレーションチェック

### Phase 4: オプション機能（必要に応じて）
6. ⚪ Storybookビルドチェック

---

## 必要なGitHub Secrets設定

以下のSecretsをGitHubリポジトリに設定する必要があります：

### 必須
- `SUPABASE_PROJECT_ID`: SupabaseプロジェクトID（マイグレーションチェック用）
- `SUPABASE_ACCESS_TOKEN`: Supabaseアクセストークン（マイグレーションチェック用）

### オプション
- `VERCEL_TOKEN`: Vercel APIトークン（デプロイワークフロー用、Vercel自動デプロイを使用する場合は不要）
- `VERCEL_ORG_ID`: Vercel組織ID（デプロイワークフロー用）
- `VERCEL_PROJECT_ID`: VercelプロジェクトID（デプロイワークフロー用）
- `SLACK_WEBHOOK_URL`: Slack通知用（デプロイ通知）
- `DISCORD_WEBHOOK_URL`: Discord通知用（デプロイ通知）
- `CODECOV_TOKEN`: Codecovトークン（カバレッジレポート用）

---

## ワークフロー実行の最適化

### キャッシュ戦略
- **Node modules**: `actions/setup-node@v4`の`cache`オプションを使用
- **Next.jsビルドキャッシュ**: `.next`ディレクトリのキャッシュ
- **Biomeキャッシュ**: Biomeのキャッシュディレクトリ

### 並列実行
- Lint、Type Check、Testを並列実行して実行時間を短縮
- ビルドチェックは他のチェックが成功してから実行

### 条件付き実行
- 変更されたファイルに応じてワークフローをスキップ
  - Storybook関連ファイルが変更されていない場合はStorybookビルドをスキップ
  - マイグレーションファイルが変更されていない場合はDBチェックをスキップ

---

## ブランチ戦略との連携

### developブランチ
- すべてのCIチェックを実行
- プレビュー環境への自動デプロイ
- PRマージ前にすべてのチェックが成功する必要がある

### mainブランチ
- すべてのCIチェックを実行
- 本番環境への自動デプロイ
- リリース前の最終チェック

### 機能ブランチ
- すべてのCIチェックを実行
- PR作成時に自動的にチェックが実行される

---

## 期待される効果

1. **コード品質の向上**
   - Lint/Type Checkにより、早期にエラーを検出
   - テストの自動実行により、リグレッションを防止

2. **開発効率の向上**
   - 自動チェックにより、手動レビューの負担を軽減
   - ビルドエラーの早期発見

3. **デプロイの安全性向上**
   - 本番デプロイ前にすべてのチェックが成功することを保証
   - 自動デプロイにより、デプロイミスを防止

4. **保守性の向上**
   - テストカバレッジの可視化により、テスト不足を把握
   - セキュリティチェックにより、脆弱性の早期発見

---

## 次のステップ

1. **Phase 1の実装**
   - PRチェックワークフローの作成
   - テストカバレッジレポートの設定

2. **Vercel設定の確認**
   - Vercelの自動デプロイ設定を確認
   - 必要に応じてデプロイワークフローを調整

3. **Secretsの設定**
   - 必要なGitHub Secretsを設定

4. **動作確認**
   - 各ワークフローが正常に動作することを確認
   - PRで実際にテスト

5. **ドキュメント化**
   - ワークフローの説明をREADMEに追加
   - 開発者向けのガイドラインを作成

---

## 参考資料

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel GitHub Integration](https://vercel.com/docs/concepts/git)
- [Biome Documentation](https://biomejs.dev/)
- [Vitest Documentation](https://vitest.dev/)

