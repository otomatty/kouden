# RLS無限再帰エラーの修正とロジック改善

## 問題概要

香典帳詳細ページでタイトル更新機能を実行した際に、以下のエラーが発生：

```
"infinite recursion detected in policy for relation \"koudens\""
```

このエラーは、PostgreSQLのRow Level Security (RLS) ポリシーにおいて循環参照が発生したことを示している。

## 問題の根本原因

### 1. RLSポリシーの循環参照

```sql
-- koudens テーブルのUPDATEポリシー
CREATE POLICY "unified_kouden_update" ON koudens
    FOR UPDATE
    USING (
        -- ... 他の条件 ...
        OR (id IN ( 
            SELECT mem.kouden_id
            FROM kouden_members mem
            JOIN kouden_roles r ON (mem.role_id = r.id)
            WHERE mem.user_id = auth.uid()
            AND r.permissions @> ARRAY['kouden:update'::text]
        ))
    );

-- kouden_members テーブルのポリシー
CREATE POLICY "manage_kouden_members" ON kouden_members
    FOR ALL
    USING (has_kouden_access(kouden_id, auth.uid()));

-- has_kouden_access 関数
CREATE FUNCTION has_kouden_access(p_kouden_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.koudens  -- ← ここで koudens テーブルを参照
        WHERE id = p_kouden_id
        AND (owner_id = p_user_id OR created_by = p_user_id)
        -- ...
    );
END;
$$;
```

### 2. 循環参照の流れ

1. `koudens` UPDATE → `kouden_members` を参照
2. `kouden_members` ポリシー → `has_kouden_access` 関数を呼び出し
3. `has_kouden_access` 関数 → `koudens` テーブルを参照
4. **無限ループ発生**

## 解決方法

### Phase 1: RLSポリシーの修正

循環参照を避けるため、`koudens` テーブルのUPDATEポリシーから `kouden_members` への参照を削除：

```sql
-- 修正前（問題のあるポリシー）
DROP POLICY IF EXISTS "unified_kouden_update" ON koudens;

-- 修正後（循環参照を回避）
CREATE POLICY "koudens_update_no_recursion" ON koudens
    FOR UPDATE
    TO authenticated
    USING (
        -- 直接的な所有者チェックのみ（循環参照なし）
        owner_id = auth.uid()
        OR created_by = auth.uid()
        OR is_funeral_manager_for_kouden(id)
    )
    WITH CHECK (
        owner_id = auth.uid()
        OR created_by = auth.uid()
        OR is_funeral_manager_for_kouden(id)
    );
```

### Phase 2: アプリケーション層での権限チェック強化

RLSポリシーから除去した編集者権限のチェックを、アプリケーション層で実装：

#### 1. 権限チェック関数の最適化

```typescript
// src/app/_actions/permissions.ts

/**
 * ユーザーが香典帳を編集できるか確認（最適化版）
 * RLS無限再帰を避けるため、直接JOINして権限を確認
 */
export async function canEditKouden(koudenId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    // 1回のクエリで所有者チェックとメンバーロールチェックを実行
    const { data } = await supabase
        .from("koudens")
        .select(`
            owner_id,
            created_by,
            kouden_members!left (
                role_id,
                user_id,
                kouden_roles (
                    name
                )
            )
        `)
        .eq("id", koudenId)
        .single();

    if (!data) return false;

    // 所有者または作成者の場合は編集可能
    if (data.owner_id === user.id || data.created_by === user.id) {
        return true;
    }

    // メンバーロールをチェック
    const userMember = data.kouden_members?.find((member) => member.user_id === user.id);

    if (!userMember || !userMember.kouden_roles) {
        return false;
    }

    // editorロールの場合は編集可能
    return userMember.kouden_roles.name === "editor";
}
```

#### 2. Server Actionでの権限チェック強化

```typescript
// src/app/_actions/koudens/update.ts

export async function updateKouden(id: string, input: { title: string; description?: string }) {
    // 入力バリデーション
    if (!input.title?.trim()) {
        throw new Error("タイトルを入力してください");
    }

    if (input.title.length > 100) {
        throw new Error("タイトルは100文字以内で入力してください");
    }

    if (input.description && input.description.length > 500) {
        throw new Error("説明は500文字以内で入力してください");
    }

    // 権限チェック（最適化版を使用）
    const canEdit = await canEditKouden(id);
    if (!canEdit) {
        throw new Error("この香典帳を編集する権限がありません");
    }

    // データベース更新処理
    const supabase = await createClient();
    const updateData = {
        title: input.title.trim(),
        description: input.description?.trim() || null,
    };

    const { error } = await supabase.from("koudens").update(updateData).eq("id", id);

    if (error) {
        console.error("Failed to update kouden:", error);
        throw new Error("香典帳の更新に失敗しました。しばらく経ってから再度お試しください。");
    }

    revalidatePath(`/koudens/${id}`);
}
```

#### 3. UIレイヤーでの権限チェック修正

```typescript
// src/app/(protected)/koudens/[id]/_components/_common/kouden-title.tsx

// 修正前：ownerのみ編集可能
{permission === "owner" && (
    <Button /* ... */>
        <Pencil className="h-4 w-4" />
    </Button>
)}

// 修正後：ownerとeditorが編集可能
import { canUpdateKouden } from "@/store/permission";

{canUpdateKouden(permission) && (
    <Button /* ... */>
        <Pencil className="h-4 w-4" />
    </Button>
)}
```

## ロジック改善のポイント

### 1. エラーハンドリングの強化

```typescript
const handleSave = async () => {
    if (!title.trim()) {
        toast.error("タイトルを入力してください");
        return;
    }

    setIsLoading(true);
    try {
        await updateKouden(koudenId, {
            title: title.trim(),
            description: description.trim() || undefined,
        });
        setIsEditing(false);
        toast.success("香典帳の情報を更新しました");
    } catch (error) {
        console.error("Failed to update kouden:", error);
        const errorMessage = error instanceof Error ? error.message : "更新に失敗しました";
        toast.error(errorMessage);
    } finally {
        setIsLoading(false);
    }
};
```

### 2. パフォーマンス最適化

- **1回のクエリで複数チェック**: 所有者確認とメンバーロール確認を単一クエリで実行
- **キャッシュ活用**: `cache()` を使用した権限チェック関数のキャッシュ化
- **不要なデータベースアクセス削減**: RLS循環参照回避により、データベース負荷を軽減

### 3. ユーザビリティ向上

- **詳細なバリデーションメッセージ**: 文字数制限やフィールド必須の明確な表示
- **ローディング状態**: 保存中の視覚的フィードバック
- **成功/失敗通知**: Toastによる操作結果の通知

## 設計原則の遵守

### 1. ロジックとコンポーネントの分離

- **Server Actions**: CRUD操作は `src/app/_actions` ディレクトリに配置
- **権限チェック**: `src/app/_actions/permissions.ts` で集約管理
- **UI権限制御**: `src/store/permission.ts` でUI表示権限を管理

### 2. エラーハンドリングの階層化

- **サーバー層**: 権限チェック、バリデーション、データベースエラー
- **クライアント層**: ユーザー入力検証、UI状態管理
- **ユーザー層**: Toast通知による適切なフィードバック

### 3. セキュリティの多層防御

- **RLS**: データベースレベルでの基本アクセス制御
- **Server Actions**: アプリケーションレベルでの詳細権限チェック
- **UI**: クライアントレベルでの表示制御（セキュリティ目的ではなく、UX向上）

## 今後の注意点

### 1. RLS設計時の注意

- **循環参照の回避**: テーブル間の相互参照は慎重に設計
- **シンプルなポリシー**: 複雑なJOINは避け、直接的な条件チェックを優先
- **アプリケーション層との役割分担**: RLSは基本的なアクセス制御、詳細権限はアプリケーション層

### 2. 権限チェック関数の設計

- **単一責任**: 1つの関数は1つの権限チェックのみ
- **キャッシュ活用**: 同一リクエスト内での重複チェック回避
- **エラーハンドリング**: 権限なしとエラーの明確な区別

### 3. テストの重要性

- **権限パターンテスト**: owner/editor/viewer各ロールでの動作確認
- **エッジケーステスト**: 権限変更タイミング、セッション切れ等
- **パフォーマンステスト**: 権限チェック関数の実行時間測定

## 参考情報

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- プロジェクト内関連ファイル:
  - `database/koudens.sql` - RLSポリシー定義
  - `src/app/_actions/permissions.ts` - 権限チェック関数
  - `src/store/permission.ts` - UI権限制御 