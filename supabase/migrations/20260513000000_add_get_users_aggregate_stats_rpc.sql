-- 管理者ユーザー一覧のN+1解消用RPC関数
-- Issue: https://github.com/otomatty/kouden/issues/36
--
-- 指定された user_id 群について、以下を1クエリで一括取得:
--   - 所有香典帳数 (koudens.owner_id)
--   - 参加香典帳数 (kouden_members.user_id)
--   - 作成エントリー数 (kouden_entries.created_by)
--   - 管理者ロール / 付与日時 (admin_users)
--
-- 呼び出し元は必ず isAdmin() チェックを行ったServer Actionから使用する前提。

CREATE OR REPLACE FUNCTION public.get_users_aggregate_stats(
    p_user_ids uuid[]
)
RETURNS TABLE (
    user_id uuid,
    owned_koudens_count bigint,
    participated_koudens_count bigint,
    total_entries_count bigint,
    admin_role text,
    admin_created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH input_ids AS (
        SELECT unnest(p_user_ids) AS uid
    ),
    owned AS (
        SELECT owner_id AS uid, COUNT(*)::bigint AS cnt
        FROM koudens
        WHERE owner_id = ANY(p_user_ids)
        GROUP BY owner_id
    ),
    participated AS (
        SELECT user_id AS uid, COUNT(*)::bigint AS cnt
        FROM kouden_members
        WHERE user_id = ANY(p_user_ids)
        GROUP BY user_id
    ),
    entries_cnt AS (
        SELECT created_by AS uid, COUNT(*)::bigint AS cnt
        FROM kouden_entries
        WHERE created_by = ANY(p_user_ids)
        GROUP BY created_by
    ),
    admin AS (
        SELECT user_id AS uid, role::text AS r, created_at AS ca
        FROM admin_users
        WHERE user_id = ANY(p_user_ids)
    )
    SELECT
        i.uid,
        COALESCE(o.cnt, 0),
        COALESCE(p.cnt, 0),
        COALESCE(e.cnt, 0),
        a.r,
        a.ca
    FROM input_ids i
    LEFT JOIN owned o ON o.uid = i.uid
    LEFT JOIN participated p ON p.uid = i.uid
    LEFT JOIN entries_cnt e ON e.uid = i.uid
    LEFT JOIN admin a ON a.uid = i.uid;
$$;

REVOKE ALL ON FUNCTION public.get_users_aggregate_stats(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_users_aggregate_stats(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.get_users_aggregate_stats(uuid[]) IS
    '管理者ユーザー一覧用: 指定 user_id 群の koudens/members/entries 件数 + admin role を一括取得 (N+1解消)';
