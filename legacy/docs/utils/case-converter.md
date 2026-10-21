# キャメルケースとスネークケースの変換
このアプリケーションはSupabaseの型生成を使用して型定義を作成しているため、データベースのカラム名はスネークケースで保存されている。
そのため、キャメルケースで型定義を作成するために、キャメルケースとスネークケースの変換を行う必要がある。

## いつ変換するか

- 保存前にキャメルケース -> スネークケースに変換
- 取得後にスネークケース -> キャメルケースに変換

## どこで変換するか

### データの取り扱い
- Server Actionsのファイルで行う
    - データ取得時(Read)にスネークケース -> キャメルケースに変換
    - データ保存時(Create, Update, Delete)にキャメルケース -> スネークケースに変換
- API Routeを使用する場合はそのファイルでも行う

### 型定義
- 型定義ファイルは`SnakeToCamelCaseNested`を使用して型定義を作成する
    - 保存場所は`@/types`
    - 独自の型定義は避ける
    - ちなみにSupabaseで生成された型定義は`supabase.d.ts`として保存されている

## 何を変換するか

- キャメルケースの文字列 -> スネークケースの文字列
- スネークケースの文字列 -> キャメルケースの文字列

## どのように変換するか
- ライブラリは`snakecase-keys`, `camelcase-keys`を使用する
- ライブラリの使用方法は[こちら](https://github.com/sindresorhus/snakecase-keys)

## コード

### Server Actions
```ts
'use server'; // Server Actionsであることを明示

import { createClient } from '@/lib/supabase/server'; // Supabaseクライアントの作成関数 (パスは環境に合わせてください)
import { camelToSnake, snakeToCamel } from '@/utils/case-converter';
import { Request, RequestSnake } from '@/types/requests'; //型定義は別のファイルで管理する

const supabase = await createClient();

// 保存前にキャメルケース -> スネークケースに変換
export const saveRequest = async (request: Request) => {
  try {
        const { error } = await supabase
        .from<RequestSnake>('requests')
        .insert(camelToSnake(request), { returning: 'minimal' }); // 保存前にキャメルケース -> スネークケースに変換

    if (error) {
      console.error('Error saving request:', error);
      return { error: 'Failed to save request' }; // エラーハンドリングを実装
    }

    return { data: { success: true } }; // 成功時のレスポンスを返す
  } catch (error) {
    console.error('Unexpected error saving request:', error);
    return { error: 'Unexpected error occurred' }; // エラーハンドリングを実装
  }
};

  // 取得後にスネークケース -> キャメルケースに変換
export const loadRequest = async (slug: string) => {
  try {
    const { data, error } = await supabase
      .from<RequestSnake>('requests')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error loading request:', error);
      return { error: 'Failed to load request' }; // エラーハンドリングを実装
    }

    return { data: data ? snakeToCamel(data as RequestSnake) : null }; // 取得後にスネークケース -> キャメルケースに変換
  } catch (error) {
    console.error('Unexpected error loading request:', error);
    return { error: 'Unexpected error occurred' }; // エラーハンドリングを実装
  }
};
```

### 型定義
```ts  
// requests.ts
import type { Database } from '@/types/supabase'; // Supabaseで生成された型定義 (パスは環境に合わせてください)
import type { SnakeToCamelCaseNested } from '@/utils/case-converter';

export type Request = SnakeToCamelCaseNested<Database["public"]["Tables"]["requests"]["Row"]>; // アプリケーションで使用する型を定義

// 型定義を拡張する場合

```
