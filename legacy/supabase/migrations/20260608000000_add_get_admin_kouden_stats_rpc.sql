-- 管理者向け香典帳一覧のN+1解消用RPC関数
-- Issue: https://github.com/otomatty/kouden/issues/116
--
-- 指定された kouden_id 群について、以下を1クエリで一括取得:
--   - エントリー数 (kouden_entries)
--   - メンバー数 (kouden_members)
--   - 香典合計金額 (kouden_entries.amount の合計)
--
-- 従来は admin/users.ts::getAllKoudens が各香典帳ごとに
-- entries / members / amount を個別 SELECT していた（N+1）。
--
-- セキュリティ:
--   SECURITY DEFINER で RLS をバイパスして集計するため、関数内で
--   is_admin(auth.uid()) をチェックして管理者以外からの呼び出しを拒否する。

CREATE OR REPLACE FUNCTION public.get_admin_kouden_stats(
    p_kouden_ids uuid[]
)
RETURNS TABLE (
    kouden_id uuid,
    entries_count bigint,
    members_count bigint,
    total_amount bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 呼び出し元が管理者であることを必須化（RLSバイパスの保護）
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'permission denied: admin role required for get_admin_kouden_stats'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    WITH input_ids AS (
        SELECT unnest(p_kouden_ids) AS kid
    ),
    entries AS (
        SELECT ke.kouden_id AS kid,
               COUNT(*)::bigint AS cnt,
               COALESCE(SUM(ke.amount), 0)::bigint AS amount_sum
        FROM kouden_entries ke
        WHERE ke.kouden_id = ANY(p_kouden_ids)
        GROUP BY ke.kouden_id
    ),
    members AS (
        SELECT km.kouden_id AS kid, COUNT(*)::bigint AS cnt
        FROM kouden_members km
        WHERE km.kouden_id = ANY(p_kouden_ids)
        GROUP BY km.kouden_id
    )
    -- RETURNS TABLE の列名と明示的に揃えておく（可読性・保守性のため）
    SELECT
        i.kid AS kouden_id,
        COALESCE(e.cnt, 0) AS entries_count,
        COALESCE(m.cnt, 0) AS members_count,
        COALESCE(e.amount_sum, 0) AS total_amount
    FROM input_ids i
    LEFT JOIN entries e ON e.kid = i.kid
    LEFT JOIN members m ON m.kid = i.kid;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_kouden_stats(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_kouden_stats(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.get_admin_kouden_stats(uuid[]) IS
    '管理者香典帳一覧用: 指定 kouden_id 群の entries/members 件数 + 香典合計金額を一括取得 (N+1解消)。関数内で is_admin(auth.uid()) を強制。';
