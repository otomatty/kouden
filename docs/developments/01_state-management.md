# 状態管理の実装方針

## 概要

このドキュメントでは、香典帳アプリケーションにおける状態管理の実装方針について説明します。
アプリケーションは共同編集機能を持ち、複数のユーザーが同時にデータを操作することができます。

## アーキテクチャ

### 技術スタック

- Next.js Server Actions: データの永続化と操作
- Supabase Realtime: リアルタイム更新
- Jotai: クライアントサイドの状態管理

### レイヤー構成

1. **サーバーサイド（Server Actions）**
   - データの永続化
   - バリデーション
   - 認証・認可
   - キャッシュの無効化

2. **リアルタイム同期（Supabase Realtime）**
   - WebSocketによるリアルタイム更新
   - データの同期
   - 変更の即時反映

3. **クライアントサイド（Jotai）**
   - UI状態の管理
   - 楽観的更新
   - 一時的な状態の管理

## 実装パターン

### Server Actions

```typescript
// app/_actions/entries.ts
'use server'

export async function getEntries(koudenId: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('kouden_entries')
    .select('*')
    .eq('kouden_id', koudenId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function createEntry(input: CreateEntryInput) {
  const supabase = createServerClient();
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  const { data, error } = await supabase
    .from('kouden_entries')
    .insert({
      ...input,
      created_by: session.user.id
    })
    .select()
    .single();
    
  if (error) throw error;
  revalidatePath(`/koudens/${input.koudenId}`);
  return data;
}
```

### リアルタイム同期

```typescript
// hooks/useRealtimeSync.ts
export function useRealtimeSync(koudenId: string, onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`kouden_entries:${koudenId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kouden_entries',
          filter: `kouden_id=eq.${koudenId}`
        },
        onUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [koudenId, onUpdate]);
}
```

### クライアントサイドの状態管理

```typescript
// atoms/entries.ts
import { atom } from 'jotai';

// 実際のエントリーデータ
export const entriesAtom = atom<Entry[]>([]);

// 楽観的更新用のデータ
export const optimisticEntriesAtom = atom<OptimisticEntry[]>([]);

// 統合されたデータ
export const mergedEntriesAtom = atom((get) => {
  const realEntries = get(entriesAtom);
  const optimisticEntries = get(optimisticEntriesAtom);
  
  return [...optimisticEntries, ...realEntries];
});
```

## エラーハンドリング

### サーバーサイド

```typescript
export async function handleServerError(error: unknown) {
  if (error instanceof DatabaseError) {
    return { error: 'データベースエラーが発生しました' };
  }
  if (error instanceof ValidationError) {
    return { error: '入力内容を確認してください' };
  }
  return { error: '予期せぬエラーが発生しました' };
}
```

### クライアントサイド

```typescript
export function useErrorHandling() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    setError(error);
    toast.error(error.message);
  }, []);

  return { error, handleError };
}
```

## パフォーマンス最適化

### メモ化

```typescript
const MemoizedComponent = memo(function Component({ data }: Props) {
  return <div>{/* コンポーネントの内容 */}</div>;
});
```

### 楽観的更新

```typescript
function useOptimisticUpdate() {
  const [optimisticData, setOptimisticData] = useAtom(optimisticEntriesAtom);

  const addOptimisticEntry = useCallback((entry: Entry) => {
    const optimisticEntry = {
      ...entry,
      id: crypto.randomUUID(),
      isOptimistic: true
    };
    setOptimisticData([optimisticEntry, ...optimisticData]);
    return optimisticEntry;
  }, [optimisticData, setOptimisticData]);

  const removeOptimisticEntry = useCallback((id: string) => {
    setOptimisticData(data => data.filter(entry => entry.id !== id));
  }, [setOptimisticData]);

  return { addOptimisticEntry, removeOptimisticEntry };
}
```

## ベストプラクティス

1. **データ操作の原則**
   - Server Actionsでのみデータを永続化
   - クライアントサイドでは一時的な状態のみを管理
   - リアルタイム更新は自動的に同期

2. **エラーハンドリング**
   - 適切なエラーメッセージの提供
   - ユーザーへの明確なフィードバック
   - エラー状態からの回復手段の提供

3. **パフォーマンス**
   - 不要な再レンダリングの防止
   - 適切なメモ化の使用
   - 効率的なデータ構造の選択

4. **型安全性**
   - 厳密な型定義の使用
   - 型推論の活用
   - ランタイムでの型チェック

## 注意点

1. **競合解決**
   - Last-Write-Winsポリシーの採用
   - 競合が発生した場合のユーザーへの通知
   - データの整合性の確保

2. **オフライン対応**
   - オフライン時の一時的なデータ保存
   - 再接続時の同期
   - エラー状態からの回復

3. **セキュリティ**
   - 適切な認証・認可の実装
   - データアクセスの制限
   - 入力値のバリデーション

## 今後の課題

1. **パフォーマンスの最適化**
   - 大量データ時の処理の改善
   - メモリ使用量の最適化
   - ネットワーク通信の効率化

2. **機能の拡張**
   - 履歴管理の実装
   - より詳細な権限管理
   - バッチ処理の最適化

3. **ユーザビリティの向上**
   - より直感的なUI/UX
   - エラーメッセージの改善
   - ヘルプ機能の充実

## 実装状況の確認項目

### 1. Server Actions

#### 基本実装
- [ ] CRUD操作の実装
  - [ ] 作成処理
  - [ ] 読み取り処理
  - [ ] 更新処理
  - [ ] 削除処理
- [ ] エラーハンドリング
  - [ ] バリデーションエラー
  - [ ] データベースエラー
  - [ ] 認証エラー
- [ ] 型定義
  - [ ] 入力型の定義
  - [ ] 戻り値の型定義
  - [ ] エラー型の定義

#### パフォーマンス
- [ ] キャッシュの最適化
  - [ ] revalidatePathの適切な使用
  - [ ] キャッシュの無効化タイミング
- [ ] データフェッチの最適化
  - [ ] 必要なフィールドのみの取得
  - [ ] 適切なインデックスの使用

### 2. リアルタイム同期

#### Supabase Realtime
- [ ] チャンネルの設定
  - [ ] テーブルごとの購読設定
  - [ ] フィルタリングの設定
  - [ ] イベントタイプの設定
- [ ] イベントハンドリング
  - [ ] 挿入イベントの処理
  - [ ] 更新イベントの処理
  - [ ] 削除イベントの処理
- [ ] エラー処理
  - [ ] 接続エラーの処理
  - [ ] 再接続ロジック
  - [ ] タイムアウト処理

### 3. クライアントサイドの状態管理

#### Jotai Atoms
- [ ] 基本的なAtom
  - [ ] データ保持用Atom
  - [ ] UI状態用Atom
  - [ ] エラー状態用Atom
- [ ] 派生Atom
  - [ ] フィルタリング用
  - [ ] ソート用
  - [ ] 集計用
- [ ] 最適化
  - [ ] メモ化の使用
  - [ ] 不要な再レンダリングの防止

#### 楽観的更新
- [ ] 基本実装
  - [ ] 一時的な状態の更新
  - [ ] ロールバックの実装
  - [ ] UIのフィードバック
- [ ] エラーハンドリング
  - [ ] 競合の検出
  - [ ] 競合の解決
  - [ ] ユーザーへの通知

### 4. コンポーネントの実装

#### データ表示
- [ ] テーブルコンポーネント
  - [ ] ソート機能
  - [ ] フィルター機能
  - [ ] ページネーション
- [ ] フォームコンポーネント
  - [ ] バリデーション
  - [ ] エラー表示
  - [ ] 送信処理
- [ ] ダイアログコンポーネント
  - [ ] モーダル表示
  - [ ] 状態管理
  - [ ] アクセシビリティ

#### パフォーマンス最適化
- [ ] メモ化
  - [ ] コンポーネントのメモ化
  - [ ] コールバックのメモ化
  - [ ] 値のメモ化
- [ ] 仮想化
  - [ ] リストの仮想化
  - [ ] 無限スクロール
  - [ ] 遅延読み込み

### 5. テスト実装

#### 単体テスト
- [ ] Server Actions
  - [ ] CRUD操作のテスト
  - [ ] エラーケースのテスト
  - [ ] バリデーションのテスト
- [ ] カスタムフック
  - [ ] データフェッチのテスト
  - [ ] 状態更新のテスト
  - [ ] エラーハンドリングのテスト
- [ ] ユーティリティ関数
  - [ ] データ変換のテスト
  - [ ] バリデーション関数のテスト
  - [ ] フォーマット関数のテスト

#### 統合テスト
- [ ] コンポーネント結合
  - [ ] フォームとServer Actionsの結合
  - [ ] テーブルとフィルタリングの結合
  - [ ] モーダルと状態管理の結合
- [ ] データフロー
  - [ ] 楽観的更新のフロー
  - [ ] エラーハンドリングのフロー
  - [ ] リアルタイム更新のフロー

#### E2Eテスト
- [ ] 主要フロー
  - [ ] データ作成フロー
  - [ ] データ更新フロー
  - [ ] データ削除フロー
- [ ] エッジケース
  - [ ] エラー発生時の動作
  - [ ] 競合発生時の動作
  - [ ] ネットワーク切断時の動作

## 進捗管理の方法

1. **週次レビュー**
   - 実装状況の確認
   - 問題点の洗い出し
   - 優先順位の調整

2. **品質チェック**
   - コードレビュー
   - テストカバレッジの確認
   - パフォーマンス計測

3. **ドキュメント更新**
   - 実装状況の更新
   - 新規課題の追加
   - 完了項目のマーク

## 注意事項

1. **チェックリストの使用方法**
   - 各項目を実装前に詳細化
   - 実装後に動作確認
   - 問題がある場合は課題として記録

2. **優先順位の考慮**
   - 基本機能を優先
   - パフォーマンス最適化は段階的に
   - テストは並行して実施

3. **レビューのポイント**
   - 型安全性の確保
   - パフォーマンスへの影響
   - コードの保守性 