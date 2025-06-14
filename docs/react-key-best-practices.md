# React Key プロパティのベストプラクティス

## 概要

React の `key` プロパティは、要素を一意に識別するために使用される重要な属性です。適切に使用しないと、パフォーマンスの問題やバグの原因となります。

## なぜ Key が重要なのか

React は仮想DOMを使用して効率的にUIを更新します。`key` プロパティは、React が要素の変更、追加、削除を正しく追跡するために必要です。

### 問題のあるコード例

```tsx
// ❌ 悪い例：インデックスをキーに使用
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// ❌ 悪い例：スケルトンローディングでインデックス使用
{Array.from({ length: 8 }).map((_, i) => (
  <div key={i} className="skeleton" />
))}
```

### なぜインデックスをキーに使うのが問題なのか

1. **要素の順序が変わった時の問題**
   - 配列の順序が変更されると、React が要素を正しく識別できない
   - 不要な再レンダリングが発生する
   - フォームの入力値が間違った要素に紐づく可能性

2. **パフォーマンスの問題**
   - React の差分検出アルゴリズムが効率的に動作しない
   - 本来必要のないDOM操作が発生する

## 解決方法

### 1. 一意なIDを使用する（推奨）

```tsx
// ✅ 良い例：一意なIDを使用
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

### 2. 複合キーを使用する

```tsx
// ✅ 良い例：複数の値を組み合わせて一意性を保証
{items.map((item) => (
  <div key={`${item.category}-${item.id}`}>{item.name}</div>
))}
```

### 3. スケルトンローディングの場合

```tsx
// ✅ 良い例：useMemoで固定キーを生成
const skeletonKeys = useMemo(() => 
  Array.from({ length: 8 }, (_, i) => `skeleton-item-${i}-${Date.now()}`)
, []);

return (
  <div>
    {skeletonKeys.map((key) => (
      <div key={key} className="skeleton" />
    ))}
  </div>
);
```

### 4. crypto.randomUUID()を使用する場合

```tsx
// ✅ 良い例：完全に一意なキーが必要な場合
const skeletonItems = useMemo(() => 
  Array.from({ length: 8 }, () => ({
    id: crypto.randomUUID(),
    // その他のプロパティ
  }))
, []);

return (
  <div>
    {skeletonItems.map((item) => (
      <div key={item.id} className="skeleton" />
    ))}
  </div>
);
```

## ケース別の対処法

### ケース1: データベースから取得したアイテム

```tsx
// データにIDがある場合
{users.map((user) => (
  <UserCard key={user.id} user={user} />
))}

// 複合キーが必要な場合
{comments.map((comment) => (
  <Comment key={`${comment.postId}-${comment.id}`} comment={comment} />
))}
```

### ケース2: 静的なリスト

```tsx
// 静的なデータの場合、内容をキーにできる
const menuItems = ['Home', 'About', 'Contact'];

{menuItems.map((item) => (
  <MenuItem key={item} title={item} />
))}
```

### ケース3: 動的に生成されるアイテム

```tsx
// useMemoで安定したキーを生成
const dynamicItems = useMemo(() => 
  Array.from({ length: count }, (_, i) => ({
    id: `dynamic-${i}-${timestamp}`,
    content: generateContent(i)
  }))
, [count, timestamp]);

{dynamicItems.map((item) => (
  <DynamicItem key={item.id} item={item} />
))}
```

## よくある間違いと対処法

### 間違い1: Math.random()をキーに使用

```tsx
// ❌ 悪い例：毎回異なるキーが生成される
{items.map((item) => (
  <div key={Math.random()}>{item.name}</div>
))}

// ✅ 良い例：安定したキーを使用
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

### 間違い2: 配列のインデックスに依存

```tsx
// ❌ 悪い例：順序が変わると問題が発生
{sortedItems.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// ✅ 良い例：アイテム固有のプロパティを使用
{sortedItems.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

## パフォーマンスへの影響

### 適切なキーを使用した場合
- React が効率的に差分を検出
- 必要最小限のDOM操作
- スムーズなアニメーション

### 不適切なキーを使用した場合
- 不要な再レンダリング
- DOM要素の完全な再作成
- アニメーションの中断
- フォーム状態の喪失

## チェックリスト

開発時に以下の点を確認してください：

- [ ] `key` プロパティが一意であるか
- [ ] `key` が安定している（再レンダリング時に変わらない）か
- [ ] インデックスをキーに使用していないか
- [ ] `Math.random()` や `Date.now()` を直接キーに使用していないか
- [ ] リストの順序が変わる可能性がある場合、適切なキーを使用しているか

## まとめ

`key` プロパティは React の効率的な更新メカニズムの核心部分です。適切に使用することで：

1. **パフォーマンスの向上**
2. **バグの防止**
3. **予測可能な動作**

を実現できます。常に一意で安定したキーを使用することを心がけましょう。

## 参考リンク

- [React 公式ドキュメント - Lists and Keys](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
- [React 公式ドキュメント - Key の選び方](https://react.dev/learn/rendering-lists#where-to-get-your-key) 