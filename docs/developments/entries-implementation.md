# 香典情報（Entries）の実装状況と修正方針

## 実装状況

### データモデル ✅

```typescript
// types/entry.ts
interface Entry {
  id: string;
  koudenId: string;
  name: string;
  organization?: string;
  position?: string;
  postalCode?: string;
  address?: string;
  phoneNumber?: string;
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

### Server Actions ✅

```typescript
// app/_actions/entries.ts
export async function getEntries(koudenId: string);
export async function createEntry(input: CreateEntryInput);
export async function updateEntry(id: string, input: UpdateEntryInput);
export async function deleteEntry(id: string);
```

### カスタムフック ✅

```typescript
// hooks/useKoudenEntries.ts
export function useKoudenEntries(koudenId: string) {
  // エントリー一覧の取得と操作
  const { entries, isLoading, error } = useEntries(koudenId);
  // CRUD操作
  const { createEntry, updateEntry, deleteEntry } = useEntriesMutation(koudenId);
  // リアルタイム同期
  useRealtimeSync(koudenId);
}
```

### コンポーネント

#### テーブル ✅
- `EntriesTable`: エントリー一覧を表示するテーブル
- `EntryRow`: 各エントリーの行コンポーネント
- ソート機能
- ページネーション
- 検索フィルター

#### フォーム ✅
- `EntryForm`: エントリーの作成・編集フォーム
- バリデーション
- 郵便番号による住所自動入力
- 金額のフォーマット

#### ダイアログ ✅
- `EntryDialog`: エントリーの作成・編集ダイアログ
- `DeleteConfirmDialog`: 削除確認ダイアログ

### 状態管理 ✅

```typescript
// atoms/entries.ts
export const entriesAtom = atom<Entry[]>([]);
export const optimisticEntriesAtom = atom<OptimisticEntry[]>([]);
export const mergedEntriesAtom = atom((get) => {
  // 実際のデータと楽観的更新データの統合
});
```

## 修正予定の実装

### パフォーマンス最適化

1. **仮想スクロール対応** 🔄
   - `react-virtual`の導入
   - 大量データ時のパフォーマンス改善

2. **検索機能の最適化** 📅
   - インデックスの活用
   - クライアントサイドキャッシュの実装

### 機能拡張

1. **一括操作機能** 📅
   - 複数エントリーの選択
   - 一括編集・削除

2. **インポート/エクスポート** 📅
   - CSVインポート
   - Excelエクスポート

3. **履歴管理** 📅
   - 変更履歴の記録
   - 変更の取り消し機能

### エラーハンドリング

1. **エラーバウンダリの導入** 🔄
   - コンポーネントレベルのエラー処理
   - エラー画面のデザイン改善

2. **リトライ機能の強化** 📅
   - ネットワークエラー時の自動リトライ
   - バックオフアルゴリズムの実装

### テスト強化

1. **単体テストの追加** 🔄
   - カスタムフックのテスト
   - ユーティリティ関数のテスト

2. **E2Eテストの追加** 📅
   - 主要フローのテスト
   - エッジケースのテスト

## 優先度と進捗状況

### 優先度高（2024年Q2）
- 仮想スクロール対応 🔄
- エラーバウンダリの導入 🔄
- 単体テストの追加 🔄

### 優先度中（2024年Q3）
- 一括操作機能 📅
- インポート/エクスポート 📅
- リトライ機能の強化 📅
- E2Eテストの追加 📅

### 優先度低（2024年Q4）
- 履歴管理 📅
- 検索機能の最適化 📅

## 凡例
- ✅ 完了
- 🔄 実装中
- 📅 未着手 