-- 管理画面の Auth ユーザー解決のN+1 / 全件走査解消用RPC関数
-- Issue: https://github.com/otomatty/kouden/issues/116
--
-- 指定された user_id 群に対応する auth.users の email を 1 クエリで一括取得する。
--
-- 従来:
--   - admin/tickets.ts が 1 件ずつ supabase.auth.admin.getUserById(...) を呼ぶ N+1
--   - listUsers() の全ページ走査は全ユーザー数 N に比例（O(N)）
-- 本RPCは id で絞り込むため、対象 id 数 M に比例（O(M)）した 1 クエリで解決できる。
--
-- セキュリティ:
--   auth.users を参照するため SECURITY DEFINER とし、関数内で
--   is_admin(auth.uid()) をチェックして管理者以外からの呼び出しを拒否する。
--   （管理画面では従来から email を表示しており、新たな情報露出はない）

CREATE OR REPLACE FUNCTION public.get_auth_users_by_ids(
    p_user_ids uuid[]
)
RETURNS TABLE (
    id uuid,
    email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 呼び出し元が管理者であることを必須化（SECURITY DEFINER の保護）
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'permission denied: admin role required for get_auth_users_by_ids'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT u.id, u.email::text
    FROM auth.users u
    WHERE u.id = ANY(p_user_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.get_auth_users_by_ids(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_users_by_ids(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.get_auth_users_by_ids(uuid[]) IS
    '管理画面用: 指定 user_id 群の auth.users.email を1クエリで一括取得 (N+1/全件走査解消)。関数内で is_admin(auth.uid()) を強制。';
