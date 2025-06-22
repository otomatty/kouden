# CLIスクリプト テストガイド

このディレクトリには、香典帳管理システムのCLIスクリプトに関する包括的なテストスイートが含まれています。

## 📋 テスト概要

### テスト対象スクリプト
- **`changelog-manager.js`** - 更新履歴管理CLI
- **`milestone-manager.js`** - マイルストーン管理CLI  
- **`docs-manager.js`** - 統合ドキュメント管理CLI

### テストファイル構成
```
scripts/__tests__/
├── changelog-manager.test.js    # 更新履歴管理のユニットテスト
├── milestone-manager.test.js    # マイルストーン管理のユニットテスト
├── docs-manager.test.js         # 統合管理のユニットテスト
├── integration.test.js          # 統合テスト・E2Eテスト
├── test-output/                 # テスト実行時の一時ファイル（自動作成・削除）
└── README.md                    # このファイル
```

## 🚀 テスト実行方法

### 基本的なテスト実行

```bash
# 全てのテスト実行
bun test

# CLIスクリプトのテストのみ実行
bun test:cli

# ウォッチモードでテスト実行
bun test:watch

# カバレッジ付きでテスト実行
bun test:coverage

# UI付きでテスト実行
bun test:ui
```

### 個別テスト実行

```bash
# 特定のテストファイルのみ実行
bun test scripts/__tests__/changelog-manager.test.js
bun test scripts/__tests__/milestone-manager.test.js
bun test scripts/__tests__/docs-manager.test.js

# 統合テストのみ実行
bun test scripts/__tests__/integration.test.js

# 特定のテストケースのみ実行
bun test scripts/__tests__/changelog-manager.test.js -t "should create changelog"
```

### デバッグ実行

```bash
# デバッグモードでテスト実行
DEBUG=1 bun test scripts

# 詳細ログ付きでテスト実行
bun test --reporter=verbose scripts
```

## 📊 テストカバレッジ

### 対象機能
- ✅ **ファイルシステム操作** (作成、読み取り、存在チェック)
- ✅ **バリデーション機能** (バージョン、日付、期間の検証)
- ✅ **Git操作** (コミット履歴取得、タグ操作)
- ✅ **テンプレート生成** (MDX形式、フロントマター)
- ✅ **Gemini AI統合** (API呼び出し、フォールバック)
- ✅ **エラーハンドリング** (例外処理、復旧処理)
- ✅ **コマンドライン引数** (パースing、検証)

### 現在のカバレッジ目標
- **ユニットテスト**: 90%以上
- **統合テスト**: 主要ワークフローの100%
- **エラーケース**: 85%以上

## 🧪 テスト戦略

### 1. ユニットテスト
各スクリプトの個別機能をテストします。

**changelog-manager.test.js**
- ✅ 更新履歴作成機能
- ✅ バージョン番号検証
- ✅ Git統合機能
- ✅ AI生成機能とフォールバック
- ✅ テンプレート生成

**milestone-manager.test.js**
- ✅ マイルストーン作成機能
- ✅ 期間・日付検証
- ✅ インタラクティブ入力処理
- ✅ デフォルト値生成

**docs-manager.test.js**
- ✅ 統合CLI機能
- ✅ サブコマンド実行
- ✅ エラーハンドリング

### 2. 統合テスト
実際の使用シナリオをテストします。

**integration.test.js**
- ✅ E2Eワークフロー
- ✅ ファイルシステム操作
- ✅ パフォーマンステスト
- ✅ エラー復旧テスト

### 3. モッキング戦略

#### ファイルシステム操作
```javascript
vi.mock('node:fs');
fs.writeFileSync.mockImplementation(() => {});
fs.readFileSync.mockReturnValue('mock content');
```

#### Git操作
```javascript
vi.mock('node:child_process');
execSync.mockReturnValue('mock git output');
```

#### 外部API (Gemini AI)
```javascript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ /* mock response */ })
});
```

#### コンソール出力
```javascript
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
```

## 🔧 テスト環境設定

### 環境変数
テスト実行時に以下の環境変数が設定されます：

```bash
NODE_ENV=test
GOOGLE_AI_API_KEY=mock-api-key-for-testing
```

### vitest設定
`vitest.config.ts`で以下の設定を行っています：

- **環境分離**: React (jsdom) と CLI (node) で異なる環境
- **タイムアウト**: 長時間実行テスト用に10秒設定
- **モック管理**: 自動リセット・クリア機能

## 📝 テストケース例

### 成功ケース
```javascript
it('should create changelog with valid version', () => {
  createChangelog('1.2.3');
  
  expect(fs.writeFileSync).toHaveBeenCalled();
  expect(consoleSpy.log).toHaveBeenCalledWith(
    expect.stringContaining('更新履歴テンプレートを作成しました')
  );
});
```

### エラーケース
```javascript
it('should handle file system errors gracefully', () => {
  fs.writeFileSync.mockImplementation(() => {
    throw new Error('Permission denied');
  });
  
  expect(() => createChangelog('1.2.3')).toThrow('Permission denied');
});
```

### 非同期処理
```javascript
it('should generate changelog with AI', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ /* AI response */ })
  });
  
  await generateChangelog('1.2.3', null, true);
  
  expect(global.fetch).toHaveBeenCalled();
});
```

## 🐛 トラブルシューティング

### よくある問題

**Q: テストが"process.exit called"エラーで失敗する**
A: スクリプトのexit処理をモックしています。期待される動作です。

```javascript
const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});
```

**Q: ファイルシステム操作のテストが実際のファイルを作成してしまう**
A: `vi.mock('node:fs')`でファイルシステムをモックしています。

**Q: Git操作のテストが失敗する**
A: `vi.mock('node:child_process')`でGitコマンドをモックしています。

**Q: 統合テストの一時ファイルが残る**
A: `beforeAll`と`afterAll`で自動的にクリーンアップされます。

### デバッグ方法

1. **個別テスト実行**
   ```bash
   bun test scripts/__tests__/changelog-manager.test.js -t "specific test name"
   ```

2. **詳細ログ確認**
   ```bash
   bun test --reporter=verbose scripts
   ```

3. **モック状態確認**
   ```javascript
   console.log(fs.writeFileSync.mock.calls);
   ```

## 🔄 継続的改善

### テスト追加の指針
新しい機能を追加する際は、以下のテストを含めてください：

1. **ハッピーパス**: 正常な動作のテスト
2. **エラーケース**: 異常処理のテスト  
3. **エッジケース**: 境界値や特殊条件のテスト
4. **パフォーマンス**: 必要に応じて実行時間のテスト

### テストデータ管理
- モックデータは各テストファイル内で定義
- 共通的なテストユーティリティは`integration.test.js`の`testUtils`を参考
- 実際のファイル生成が必要な場合は`test-output`ディレクトリを使用

## 📚 参考資料

- [Vitest公式ドキュメント](https://vitest.dev/)
- [Node.js Test Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [CLI Testing Strategies](https://blog.nodejs.org/en/post/cli-testing-2021-12-17)

---

**💡 ヒント**: テストを書く前に、まず手動でCLIスクリプトを実行して期待される動作を確認することをお勧めします。 