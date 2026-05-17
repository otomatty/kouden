# Server Actions: `ActionResult<T>` 移行ガイド

`src/lib/errors.ts` で定義済みの `ActionResult<T>` / `withActionResult` を全 Server Action に適用していくための指針。

## 統一する戻り値型

```ts
// src/lib/errors.ts
export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;     // ErrorCodes のいずれか、または任意の文字列
        message: string;  // エンドユーザー向け日本語メッセージ
        status: number;   // HTTP ステータス相当
      };
    };
```

## 統一の理由

- **判別可能ユニオン**で TypeScript が `ok` の絞り込みを自動で行うため、`if (!result.ok) return; result.data` のように安全に分岐できる
- `error: string` だけでなく `code` と `status` も持つことで、UI 側で「権限エラーだけ別画面」「リトライ可能なエラーは再試行」など分岐がしやすい
- ログ用情報（`details`, `cause`）はサーバー内に閉じ、クライアントには漏らさない

## 既存パターンとの対応

### パターン A: throw する → `withActionResult` でラップ
```ts
// Before
export async function createCase(...) {
  if (error) throw error;
}

// After
export async function createCase(...): Promise<ActionResult<Case>> {
  return withActionResult(async () => {
    if (error) throw error;
    return data;
  }, "ケースの作成");
}
```

### パターン B: `{ data, error: null }` 形式 → `ActionResult`
```ts
// Before
return { settings, error: null };
return { settings: null, error: "失敗しました" };

// After
return { ok: true, data: settings };
return { ok: false, error: { code: "...", message: "失敗しました", status: 500 } };
// もしくは withActionResult でラップして自動生成
```

### パターン C: 日本語 throw → `KoudenError`
```ts
// Before
throw new Error("香典帳へのアクセス権限がありません");

// After
throw new KoudenError("香典帳へのアクセス権限がありません", ErrorCodes.FORBIDDEN);
// withActionResult が ActionResult に変換
```

## 移行手順

1. 関数シグネチャを `Promise<ActionResult<T>>` に変更
2. 中身を `return withActionResult(async () => { ... return data; }, "...の操作");` で包む
3. 内部で `KoudenError` または通常の Error / Supabase Error を `throw` するだけにする（withActionResult が `ActionResult` 形に変換）
4. 呼び出し元を `if (!result.ok) { ... } else { result.data }` の形に置き換える

## 呼び出し側パターン

### サーバーコンポーネント / ページ
```tsx
const result = await getUserSettings(userId);
if (!result.ok) {
  throw new Error(result.error.message);
}
const settings = result.data;
```

### クライアントコンポーネント（toast）
```tsx
const result = await updateUserSettings(userId, params);
if (!result.ok) {
  toast.error(result.error.message);
  return;
}
toast.success("更新しました");
```

### エラーコードで分岐
```tsx
if (!result.ok) {
  if (result.error.code === "FORBIDDEN") {
    redirect("/no-permission");
  } else {
    toast.error(result.error.message);
  }
  return;
}
```

## 例外: `ActionResult` を返さない関数

以下のケースでは `ActionResult` を返さなくてよい:

- **失敗時にフォールバック値を返す関数**（例: `getGuideVisibility()` は失敗時 `true` を返す）
- **副作用なしの純粋な計算 / バリデーション**
- **API Route の handler**（`NextResponse.json({...}, { status })` を返す）

## 移行ステータス

実施済み:
- `src/app/_actions/settings.ts` (4関数すべて) — PR #98 (#41 の最初の段)
- `src/app/_actions/admin/admin-2fa.ts` は `TwoFactorActionResult` 独自型を使用中（次の移行候補）

残り（57 ファイル中 約56 ファイル）は段階的に対応する。1モジュールずつ独立した PR にすることで、レビュー時の差分を小さく保つ。

## API Route のエラーレスポンス統一

別タスクだが、API Route のエラーレスポンスも次の形に揃えるとよい:
```json
{
  "error": { "code": "FORBIDDEN", "message": "権限がありません", "status": 403 }
}
```

現状 `{ error: string }`, `{ error: string, details: any }`, `{ error: string, options: [...] }` などが混在している。
