# `"use client"` 適用方針

Next.js App Router における `"use client"` 指令の適用ルール。

## 原則

**デフォルトはサーバーコンポーネント。** `"use client"` は「本当に必要な箇所」だけに付ける。

## `"use client"` が必要なケース

以下のいずれかに該当する場合のみ付ける。

1. **React フック**: `useState` / `useEffect` / `useRef` / `useMemo` / `useCallback` / `useReducer` / `useContext` / `useId` / `useTransition`
2. **Next.js クライアントフック**: `useRouter` / `usePathname` / `useSearchParams` (from `next/navigation`)
3. **状態管理ライブラリ**: jotai (`useAtom*`) / zustand (`useStore`) / SWR (`useSWR`) / TanStack Query (`useQuery`)
4. **フォームライブラリ**: `react-hook-form` の `useForm`/`useFormContext` など
5. **DOM イベントハンドラ**: `onClick` / `onChange` / `onSubmit` / `onKeyDown` などを JSX 内で直接定義する場合
6. **ブラウザ API**: `window` / `document` / `localStorage` / `sessionStorage` / `navigator` などを参照する場合
7. **クラスコンポーネント / `ErrorBoundary`**
8. **`dynamic(() => …, { ssr: false })`** を使う場合

## `"use client"` が **不要** なケース

- 単純な props 受け取りと JSX レンダリングのみ
- `className` の合成 (`cn`) や条件付きクラス
- 静的データのループ表示
- Radix / shadcn-ui のクライアントコンポーネント (`Accordion`, `HoverCard` など) を子要素として配置するだけのラッパー
  - **重要**: 子に置く分には親はサーバーコンポーネントのままで良い。Next.js はサーバーコンポーネントが子としてクライアントコンポーネントを含むことを許容する。
- `next/link`, `next/image` を使うだけのコンポーネント (これらはサーバーコンポーネントから利用可能)
- 純粋なフォーム要素 (`<input>`, `<textarea>`) を spread で受け流すラッパー (`{...register}` の様な hook 由来 prop は呼び出し側にあるため不要)

## アンチパターン

### NG: 「念のため」付与
```tsx
"use client"; // ❌ 子に Radix を使うだけのために付けている

import { Accordion } from "@/components/ui/accordion";
export function FAQ() {
  return <Accordion items={STATIC_FAQS} />;
}
```

### OK: 必要箇所だけクライアント化
```tsx
import { Accordion } from "@/components/ui/accordion";
export function FAQ() {
  return <Accordion items={STATIC_FAQS} />;
}
// 親はサーバー、子の Accordion がクライアント。
```

### NG: クライアント化したくないのに hooks を引きずる
```tsx
"use client";
import { useEffect } from "react";
useEffect(() => { /* logging */ }, []); // ❌ 本当に必要か再考。サーバー側で済む処理ではないか？
```

## 分割パターン

「ページの大部分は表示用、ごく一部だけインタラクティブ」というケースでは、**インタラクティブな部分だけを小さなクライアントコンポーネントに切り出す**。

```tsx
// page.tsx (server)
export default async function Page() {
  const data = await fetchOnServer();
  return (
    <>
      <DisplaySection data={data} />        {/* server */}
      <InteractiveDialog data={data} />     {/* client (小) */}
    </>
  );
}
```

## レビュー時のチェック

PR レビュー時、`"use client"` を新規追加する diff があれば「上記のうちどれに該当するか」をコメントで確認する。
