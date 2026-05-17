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

issue #41 で `src/app/_actions/` 配下を一括移行済み。`ActionResult` を返す
全 Server Action と呼び出し側 (約 130 ファイル) を同一 PR で揃えた。

### `ActionResult` を返さない関数（例外として残存）

「失敗時にフォールバック値を返す」設計が必要な以下は意図的に旧シグネチャを
維持している。呼び出し側はこの戻り値をそのまま使う:

- `auth.ts::getCurrentUser` / `user.ts::getUser` / `user.ts::getUserId`
  — 未ログイン・取得失敗時 `null`
- `settings.ts::getGuideVisibility` — 失敗時 `true`
- `user-surveys.ts::getUserSurveyStatus` /
  `checkOneWeekOwnershipSurvey` / `checkSurveySkipStatus`
- `admin/permissions.ts::isAdmin` — 失敗時 `false`
- `admin/dashboard.ts` の集計関数群 — 空配列・ゼロ件で UI を継続させる
- `help/help-items.ts` の表示用ヘルパー
- `permissions.ts` の判定系 (`canEditKouden` 等) — UI 直結の boolean
- `admin/middleware.ts::withAdmin` / `withSuperAdmin` —
  Next.js `redirect()` を内包する HOF。`withActionResult` で包むと
  `NEXT_REDIRECT` 内部例外を吸収してしまうため。

内部ヘルパー (非 export) はラップせず `KoudenError` を `throw` するだけ。
呼び出し元の `withActionResult` がまとめて変換する。

## API Route のエラーレスポンス統一

別タスク。`src/app/api/` 配下の handler は `{ error: string }` 形式が
歴史的に混在しており、本 PR では行わない。今後、共通ヘルパーを
`src/lib/api/` に置いて段階的に揃える方針。
