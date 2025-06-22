# ドキュメント管理スクリプト

このディレクトリには、更新履歴とマイルストーンのドキュメントを効率的に管理するためのCLIスクリプトが含まれています。

## 📁 スクリプト一覧

- **`docs-manager.js`** - 統合ドキュメント管理CLI（メインエントリーポイント）
- **`changelog-manager.js`** - 更新履歴管理CLI
- **`milestone-manager.js`** - マイルストーン管理CLI

## 🚀 クイックスタート

### package.jsonのスクリプトを使用（推奨）

```bash
# 統合ヘルプを表示
bun run docs

# 更新履歴を作成
bun run changelog:create 1.2.3
bun run changelog:generate 1.2.3         # Gemini AI使用
bun run changelog:generate               # package.jsonのバージョンを使用
bun run changelog:generate-simple 1.2.3  # AI機能なし

# マイルストーンを作成
bun run milestone:create 2025-q1
bun run milestone:interactive
```

### 直接実行

```bash
# 統合管理CLI
bun scripts/docs-manager.js help
bun scripts/docs-manager.js changelog create 1.2.3
bun scripts/docs-manager.js milestone interactive

# 個別スクリプト
bun scripts/changelog-manager.js help
bun scripts/milestone-manager.js help
```

## 📝 更新履歴（Changelog）管理

### コマンド一覧

| コマンド | 説明 | 例 |
|----------|------|-----|
| `create <version>` | テンプレート更新履歴を作成 | `bun run changelog:create 1.2.3` |
| `generate [version] [from]` | Gitコミットから自動生成（Gemini AI） | `bun run changelog:generate 1.2.3` |
| `generate-simple <version> [from]` | 従来の方法で自動生成 | `bun run changelog:generate-simple 1.2.3` |
| `template` | テンプレートを確認 | `bun run changelog:template` |

### 使用例

```bash
# 1. 手動でテンプレートを作成して編集
bun run changelog:create 1.2.3

# 2. Gitコミットから自動生成（Gemini AI使用・推奨）
bun run changelog:generate 1.2.3

# 3. package.jsonのバージョンを使用してAI生成
bun run changelog:generate

# 4. 特定のバージョン間でコミット履歴を取得
bun run changelog:generate 1.2.3 1.2.2

# 5. AI機能を使わずに従来の方法で生成
bun run changelog:generate-simple 1.2.3
```

### 生成される更新履歴の特徴

- **Gemini AI による高品質な記述**（推奨）
- **package.json のバージョン自動取得**
- **セマンティックバージョニング対応**
- **コミットメッセージの自動分類**（新機能、バグ修正、改善）
- **MDXフォーマット**（アコーディオンコンポーネント使用）
- **メタデータ豊富**（タイプ、カテゴリ、ハイライト）

### 🤖 Gemini AI 機能

更新履歴の自動生成にGemini AIを使用できます：

1. **環境変数の設定**
   ```bash
   # .env ファイルに追加
   GOOGLE_AI_API_KEY=your_gemini_api_key
   ```

2. **AI生成の利点**
   - より自然で読みやすい日本語の記述
   - 適切なセマンティックバージョニングの判定
   - 重要度に基づいた変更点のハイライト
   - 統一された文体とフォーマット

## 🎯 マイルストーン管理

### コマンド一覧

| コマンド | 説明 | 例 |
|----------|------|-----|
| `create <period>` | テンプレートマイルストーンを作成 | `bun run milestone:create 2025-q1` |
| `interactive` | インタラクティブ作成 | `bun run milestone:interactive` |
| `template` | テンプレートを確認 | `bun run milestone:template` |

### 期間形式

- **四半期**: `YYYY-QN` (例: `2025-q1`, `2025-q2`)
- **月別**: `YYYY-MM` (例: `2025-01`, `2025-12`)

### 使用例

```bash
# 1. クイック作成
bun run milestone:create 2025-q1

# 2. インタラクティブ作成（推奨）
bun run milestone:interactive
```

### インタラクティブモードの特徴

- **ウィザード形式**で必要な情報を入力
- **デフォルト値**の自動提案
- **入力検証**（日付、進捗率など）
- **作成前の確認**

## 📂 出力ファイル

### 更新履歴
- **場所**: `src/docs/changelogs/`
- **命名**: `{version}.mdx` (例: `1-2-3.mdx`)
- **フォーマット**: MDX

### マイルストーン
- **場所**: `src/docs/milestones/`
- **命名**: `{period}.mdx` (例: `2025-q1.mdx`)
- **フォーマット**: MDX

## 🛠 高度な使用方法

### Gitタグを使った更新履歴生成

```bash
# 最新のタグから現在までの更新履歴を生成（AI使用）
bun run changelog:generate 1.2.3

# 特定のタグ間の更新履歴を生成（AI使用）
bun run changelog:generate 1.2.3 1.2.2

# package.jsonのバージョンを使用してAI生成
bun run changelog:generate
```

### コミットメッセージの分類ルール

スクリプトは以下のキーワードでコミットを分類します：

- **新機能**: `feat`, `add`, `新機能`
- **バグ修正**: `fix`, `修正`, `バグ`
- **改善**: `improve`, `改善`, `最適化`
- **その他**: 上記以外

### カスタマイズ

スクリプトの設定をカスタマイズしたい場合は、各ファイルの先頭にある定数を変更してください：

```javascript
// changelog-manager.js
const CHANGELOG_DIR = path.join(__dirname, '../src/docs/changelogs');

// milestone-manager.js
const MILESTONE_DIR = path.join(__dirname, '../src/docs/milestones');
```

## 🎨 テンプレート

### 更新履歴テンプレート構造

```yaml
---
title: "バージョン X.Y.Z リリース"
description: "リリースの説明"
version: "X.Y.Z"
releaseDate: "YYYY-MM-DD"
type: "major|minor|patch"
category: "feature|bugfix|security|performance"
highlights:
  - "主な変更点1"
  - "主な変更点2"
breaking: false
---
```

### マイルストーンテンプレート構造

```yaml
---
title: "マイルストーンタイトル"
description: "マイルストーンの説明"
period: "YYYY-QN|YYYY-MM"
targetDate: "YYYY-MM-DD"
status: "planned|in-progress|completed"
priority: "low|medium|high"
features:
  - "機能1"
  - "機能2"
progress: 0-100
category: "feature|improvement|infrastructure"
---
```

## 🤝 貢献

新しい機能やバグ修正の提案は歓迎します。スクリプトを改善したい場合は：

1. 該当するスクリプトファイルを編集
2. テストして動作確認
3. コミットしてプルリクエスト

## 📋 トラブルシューティング

### よくある問題

**Q: `git log` でエラーが出る**
A: Gitリポジトリ内で実行していることを確認してください。

**Q: 既存のファイルを上書きしたい**
A: 現在は上書き防止機能があります。手動でファイルを削除してから再実行してください。

**Q: コミットが正しく分類されない**
A: コミットメッセージに適切なキーワード（feat, fix, improveなど）を含めてください。

### デバッグ

詳細なエラー情報が必要な場合は、`DEBUG=1` 環境変数を設定して実行してください：

```bash
DEBUG=1 npm run changelog:generate 1.2.3
```

---

**💡 ヒント**: 定期的にバージョンタグを作成することで、より正確な更新履歴が生成できます。

```bash
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
``` 