# AGENTS.md - 香典帳アプリ開発ガイドライン

## プロジェクト概要

このプロジェクトは香典帳管理アプリケーションです。Next.js + TypeScript + Supabase + Tailwind CSS + shadcn/uiの技術スタックを使用しています。

## 基本原則

### 🚫 絶対に守るべきルール

1. **TypeScriptの`any`型は絶対に使用禁止**
   - 型安全性を損なう`any`は一切使用しない
   - 不明な型は`unknown`を使用し、適切な型ガードを実装する
   - 外部APIレスポンスも必ず型定義を行う

2. **その場しのぎの実装禁止**
   - 根本的な問題解決を優先する
   - 将来的な拡張性を考慮した設計を行う
   - 技術的負債を蓄積させない

3. **日本語テキストの徹底**
   - ユーザーに表示される全てのテキストは日本語で記述
   - エラーメッセージ、ラベル、プレースホルダーなど全て含む
   - 日本の慣習に合わせた丁寧語を使用

## 技術スタック・アーキテクチャ

### フロントエンド
- **Next.js 15** (App Router)
- **TypeScript+**
- **React 19** (Server Components & Client Components適切に使い分け)
- **Tailwind CSS v4** (スタイリング)
- **shadcn/ui** (UIコンポーネント)

### バックエンド・データベース
- **Supabase** (認証・データベース・リアルタイム機能)
- **PostgreSQL** (メインデータベース)
- **Row Level Security (RLS)** (セキュリティ)
- **Bun** (パッケージマネージャー)

### 状態管理・データフェッチング
- **Jotai** (クライアント状態管理)
- **Supabase Client** (データフェッチング)
- **React Query/TanStack Query** (サーバー状態管理)

## コーディング規則

### 型定義・TypeScript

```typescript
// ❌ 悪い例
function processData(data: any) {
  return data.someProperty;
}

// ✅ 良い例
interface UserData {
  id: string;
  name: string;
  email: string;
}

function processData(data: UserData): string {
  return data.name;
}
```

- **すべての関数に型注釈を必須とする**
- **interfaceとtypeの使い分けを明確にする**
  - 拡張可能なオブジェクト型: `interface`
  - Union型、計算型: `type`
- **Genericsを積極的に活用する**
- **null/undefinedの扱いを明確にする**

### コンポーネント設計

```typescript
// ✅ 良いコンポーネント例
interface KoudenEntryProps {
  entry: KoudenEntry;
  onUpdate: (entry: KoudenEntry) => Promise<void>;
  isEditable?: boolean;
}

export const KoudenEntryCard: React.FC<KoudenEntryProps> = ({
  entry,
  onUpdate,
  isEditable = false
}) => {
  // 実装
};
```

- **Props型を必ず定義する**
- **デフォルト値は型定義内で明記する**
- **単一責任の原則を守る**
- **Server ComponentsとClient Componentsを適切に使い分ける**

### エラーハンドリング

```typescript
// ✅ 適切なエラーハンドリング
async function createKoudenEntry(data: CreateKoudenEntryInput) {
  try {
    const { data: entry, error } = await supabase
      .from('kouden_entries')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`記帳の作成に失敗しました: ${error.message}`);
    }

    return { success: true, data: entry };
  } catch (error) {
    console.error('記帳作成エラー:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラーが発生しました'
    };
  }
}
```

- **すべての非同期処理にエラーハンドリングを実装**
- **ユーザーフレンドリーなエラーメッセージを提供**
- **Supabaseエラーを適切にキャッチ・変換する**

### パフォーマンス最適化

- **React.memo、useMemo、useCallbackを適切に使用**
- **不要な再レンダリングを防ぐ**
- **画像の最適化（next/image使用）**
- **Suspenseとロケーティングスタイルを活用**

### データベース・セキュリティ

- **Row Level Security (RLS) を必ず有効にする**
- **SQL インジェクション対策を徹底**
- **適切な認可チェックを実装**
- **センシティブデータの暗号化**

## ファイル構成・命名規則

### ディレクトリ構造
```
src/
├── app/                 # Next.js App Router
│   ├── (public)/       # 認証不要ページ
│   ├── (protected)/    # 認証必要ページ
│   └── (system)/       # 管理者専用ページ
├── components/         # 再利用可能コンポーネント
├── hooks/             # カスタムフック
├── lib/               # ユーティリティ・設定
├── stores/            # Zustand stores
├── types/             # 型定義
└── utils/             # ヘルパー関数
```

### 命名規則
- **ファイル名**: kebab-case (`kouden-entry-form.tsx`)
- **コンポーネント名**: PascalCase (`KoudenEntryForm`)
- **関数名**: camelCase (`createKoudenEntry`)
- **定数**: SCREAMING_SNAKE_CASE (`MAX_ENTRY_COUNT`)
- **型名**: PascalCase (`KoudenEntry`)

## 特定ドメイン規則（香典帳アプリ）

### 金額の扱い
```typescript
// ✅ 金額は必ずnumber型で統一
interface KoudenEntry {
  amount: number; // 円単位
  created_at: string;
  guest_name: string;
}

// 表示時のフォーマット
const formatCurrency = (amount: number): string => {
  return `¥${amount.toLocaleString('ja-JP')}`;
};
```

### 日本の慣習への対応
- **敬語・丁寧語の適切な使用**
- **日本の住所形式に対応**
- **和暦・西暦両対応**
- **日本の電話番号フォーマット**

### データ検証
```typescript
// ✅ 香典金額のバリデーション例
const validateKoudenAmount = (amount: number): boolean => {
  // 香典の一般的な金額範囲をチェック
  return amount >= 1000 && amount <= 1000000 && amount % 1000 === 0;
};
```

## テスト戦略

- **単体テスト**: Vitest + Testing Library
- **E2Eテスト**: Playwright
- **型チェック**: TypeScript strict mode
- **リント**: ESLint + Biome

## デプロイ・運用

- **環境変数の適切な管理**
- **本番環境でのエラー監視**
- **パフォーマンス監視**
- **セキュリティ監査**

## 禁止事項

1. `any`型の使用
2. `console.log`の本番環境への残存
3. ハードコーディングされた文字列（i18n対応必須）
4. セキュリティを考慮しないデータベースアクセス
5. 適切でないエラーハンドリング
6. 未使用のimport文
7. 型安全でないキャスト

## 推奨ライブラリ

- **フォームバリデーション**: react-hook-form + zod
- **日付処理**: date-fns
- **アイコン**: lucide-react
- **PDF生成**: react-pdf
- **通知**: sonner

---

**注意**: このガイドラインに従わない実装は受け入れられません。不明な点がある場合は、必ず確認してから実装を進めてください。 