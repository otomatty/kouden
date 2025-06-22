# プロジェクト構造分離戦略

## 概要
プライベートリポジトリ `kouden` からオープンソース版 `kouden-oss` への自動同期を実現するための設計方針

## リポジトリ構成

### プライベートリポジトリ（kouden）
```
kouden/
├── src/
│   ├── core/                    # OSS公開対象
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   ├── premium/                 # プレミアム機能（非公開）
│   │   ├── ai-features/
│   │   ├── advanced-analytics/
│   │   └── enterprise/
│   ├── saas/                    # SaaS版専用（非公開）
│   │   ├── billing/
│   │   ├── multi-tenant/
│   │   └── admin/
│   └── app/                     # Next.js アプリケーション
├── components/
│   ├── ui/                      # 基本UIコンポーネント（公開）
│   └── premium/                 # プレミアムコンポーネント（非公開）
├── docs/
│   ├── oss/                     # OSS版ドキュメント（公開）
│   └── internal/                # 内部ドキュメント（非公開）
├── scripts/
│   ├── oss-sync/                # 同期用スクリプト
│   └── deployment/              # デプロイメントスクリプト
├── README.md                    # プライベート版README
├── README.oss.md                # OSS版README（同期対象）
├── LICENSE                      # プライベート版ライセンス
└── LICENSE.oss                  # OSS版ライセンス（MIT）
```

### オープンソースリポジトリ（kouden-oss）
```
kouden-oss/
├── src/
│   ├── components/              # core/components から同期
│   ├── hooks/                   # core/hooks から同期
│   ├── utils/                   # core/utils から同期
│   └── types/                   # core/types から同期
├── components/
│   └── ui/                      # ui/ から同期
├── public/                      # public/ から同期
├── docs/                        # docs/oss/ から同期
├── README.md                    # README.oss.md から同期
├── LICENSE                      # LICENSE.oss から同期
├── package.json                 # 調整後のpackage.json
└── CHANGELOG.md                 # 自動生成
```

## 機能分離方針

### OSS版に含める機能（Core）
- ✅ 基本的な香典記録機能
- ✅ 参列者情報管理
- ✅ 基本的な集計・統計
- ✅ CSV エクスポート
- ✅ PWA機能
- ✅ 基本的なチーム機能（最大3名）
- ✅ UIコンポーネントライブラリ

### プライベート版のみ（Premium）
- ❌ AI による自動入力支援
- ❌ 高度な統計・分析
- ❌ PDF 自動生成
- ❌ 複数組織管理
- ❌ API連携機能
- ❌ カスタムブランディング
- ❌ エンタープライズ機能

## 自動同期の仕組み

### 1. ディレクトリベース同期
```javascript
// scripts/oss-sync/sync-directories.js
const syncDirectories = [
  { from: 'src/core', to: 'src' },
  { from: 'components/ui', to: 'components/ui' },
  { from: 'public', to: 'public' },
  { from: 'docs/oss', to: 'docs' }
];
```

### 2. ファイル変換処理
```javascript
// scripts/oss-sync/prepare-oss-package.js
const fs = require('fs');

// package.json から有料機能の依存関係を削除
function prepareOSSPackage() {
  const packageJson = require('../../package.json');
  
  // プレミアム機能の依存関係を削除
  const premiumDeps = [
    '@google/generative-ai',
    'stripe',
    // ...その他のプレミアム依存関係
  ];
  
  premiumDeps.forEach(dep => {
    delete packageJson.dependencies[dep];
  });
  
  // OSS版用の設定に変更
  packageJson.name = 'kouden-oss';
  packageJson.description = 'Open source funeral guest book management app';
  packageJson.scripts = {
    ...packageJson.scripts,
    build: 'next build',
    start: 'next start'
  };
  
  fs.writeFileSync('oss-temp/package.json', JSON.stringify(packageJson, null, 2));
}
```

### 3. コード変換処理
```javascript
// scripts/oss-sync/remove-premium-refs.js
const fs = require('fs');
const path = require('path');

function removePremiumReferences(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      removePremiumReferences(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // プレミアム機能への参照を削除
      content = content.replace(/import.*from.*['"].*\/premium\/.*['"];?\n/g, '');
      content = content.replace(/\/\* PREMIUM_START \*\/[\s\S]*?\/\* PREMIUM_END \*\//g, '');
      
      // 環境変数チェックでプレミアム機能を無効化
      content = content.replace(
        /process\.env\.ENABLE_PREMIUM_FEATURES/g, 
        'false'
      );
      
      fs.writeFileSync(filePath, content);
    }
  });
}
```

## 実装のベストプラクティス

### 1. 機能フラグの活用
```typescript
// src/core/config/features.ts
export const FEATURES = {
  AI_INPUT: process.env.ENABLE_AI_FEATURES === 'true',
  ADVANCED_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  MULTI_ORG: process.env.ENABLE_MULTI_ORG === 'true',
} as const;

// 使用例
if (FEATURES.AI_INPUT) {
  // AI機能を有効化
}
```

### 2. 条件付きインポート
```typescript
// src/core/components/EntryForm.tsx
import { BaseEntryForm } from './BaseEntryForm';

/* PREMIUM_START */
import { AIEntryForm } from '../premium/AIEntryForm';
/* PREMIUM_END */

export const EntryForm = () => {
  /* PREMIUM_START */
  if (FEATURES.AI_INPUT) {
    return <AIEntryForm />;
  }
  /* PREMIUM_END */
  
  return <BaseEntryForm />;
};
```

### 3. 段階的な機能制限
```typescript
// src/core/hooks/useKoudenLimit.ts
export const useKoudenLimit = () => {
  const isPremium = process.env.ENABLE_PREMIUM_FEATURES === 'true';
  
  return {
    maxKoudenCount: isPremium ? Infinity : 30,
    maxTeamMembers: isPremium ? Infinity : 3,
    hasAIFeatures: isPremium,
    hasAdvancedAnalytics: isPremium
  };
};
```

## セキュリティ考慮事項

### 1. 機密情報の除外
- API キーやシークレットは同期対象外
- 商用ロジックやアルゴリズムは含めない
- 課金・決済関連のコードは完全分離

### 2. 自動チェック
```yaml
# .github/workflows/security-check.yml
- name: Check for sensitive data
  run: |
    if grep -r "STRIPE_SECRET" oss-temp/; then
      echo "Sensitive data found!"
      exit 1
    fi
```

## メリット・デメリット

### メリット
- ✅ 単一コードベースでの開発効率
- ✅ 自動同期による手作業削減
- ✅ コード品質の一貫性
- ✅ 商用機能の完全分離

### デメリット
- ❌ 初期設定の複雑さ
- ❌ 同期処理のメンテナンス
- ❌ デバッグの困難さ
- ❌ OSS版独自の修正への対応

## 運用フロー

### 1. 開発フェーズ
1. プライベートリポジトリで開発
2. 機能フラグで OSS/Premium を分離
3. プルリクエストでレビュー

### 2. リリースフェーズ
1. プライベートリポジトリにマージ
2. 自動同期が OSS版を更新
3. OSS版のCI/CDが実行
4. 必要に応じてOSS版に手動調整

### 3. メンテナンスフェーズ
1. OSS版のIssue/PRを定期確認
2. 必要な修正をプライベート版に反映
3. 自動同期で OSS版に反映

## 成功のKPI

### 技術指標
- 同期処理の成功率：99%以上
- OSS版ビルド成功率：95%以上
- コード重複率：10%以下

### コミュニティ指標
- GitHub Stars：目標500+
- Contributors：目標20+
- Issue解決率：目標80%+

この戦略により、効率的な開発と適切な機能分離を両立できるはず。 