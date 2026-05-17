-- 2026-05-17: 香典帳作成のアトミック化用 RPC 関数
-- Issue: https://github.com/otomatty/kouden/issues/81 (umbrella: #97)
--
-- 背景:
--   `createKouden` Server Action (src/app/_actions/koudens/create.ts) では
--   `koudens` INSERT 後にトリガで作成される `kouden_roles` を待つために
--   1秒スリープしていた:
--     await new Promise((resolve) => setTimeout(resolve, 1000));
--
--   - 競合状態に対するスリープによる対処はフレーキー (高負荷時に間に合わない)
--   - 香典帳作成の体感速度を 1 秒悪化
--
--   実際には `koudens` への INSERT と関連する AFTER INSERT トリガ
--   (`create_default_kouden_roles_trigger` / `trigger_add_kouden_owner`) は
--   同一トランザクション内で同期的に実行されるため、本来スリープは不要。
--   しかし呼び出し元から複数 INSERT/SELECT を続けて発行する構造自体が脆く、
--   全体を 1 つの Postgres 関数 (= 1 トランザクション) にまとめることで
--   失敗時のロールバックと挙動の明確化を担保する。
--
-- 本マイグレーションでは:
--   - `koudens` INSERT を含む一連の処理を単一 RPC `create_kouden_with_owner`
--     にカプセル化する
--   - 既存トリガが `kouden_roles` / `kouden_members` を埋めるため、RPC 自体は
--     `koudens` への INSERT 1 文と、戻り値用 SELECT のみで完結する
--   - 認証ユーザー (`auth.uid()`) でのみ実行可能。`owner_id` / `created_by` は
--     クライアントから受け取らず、必ず `auth.uid()` を使う

CREATE OR REPLACE FUNCTION public.create_kouden_with_owner(
    p_title text,
    p_description text,
    p_plan_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_kouden_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'authentication_required'
            USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;

    -- koudens への INSERT。AFTER INSERT トリガが同一トランザクション内で
    --   - create_default_kouden_roles_trigger → kouden_roles (editor/viewer)
    --   - trigger_add_kouden_owner          → kouden_members (owner = editor)
    -- を埋めるため、関数戻り時点では関連レコードが揃っている。
    INSERT INTO public.koudens (title, description, owner_id, created_by, plan_id)
    VALUES (p_title, p_description, v_user_id, v_user_id, p_plan_id)
    RETURNING id INTO v_kouden_id;

    RETURN v_kouden_id;
END;
$$;

-- 認証済みユーザーのみが実行可能 (RLS は通常通り `koudens` 側のポリシーで担保)
REVOKE ALL ON FUNCTION public.create_kouden_with_owner(text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_kouden_with_owner(text, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_kouden_with_owner(text, text, uuid) TO authenticated, service_role;
