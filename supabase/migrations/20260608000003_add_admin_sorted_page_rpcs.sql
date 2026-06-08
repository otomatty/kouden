-- 管理画面一覧の「計算列ソート + ページネーション」整合性修正用RPC関数
-- Issue: https://github.com/otomatty/kouden/issues/117
--
-- 背景:
--   admin/users.ts::getAllUsers (last_sign_in_at ソート) および
--   admin/users.ts::getAllKoudens (entries_count ソート) は、先に created_at で
--   range (ページネーション) してから、取得済みページ内だけを JS 側で並べ替えていた。
--   そのため対象ページの範囲内でしか並べ替えが効かず、全件にわたる正しい順序に
--   ならない（例: 「last_sign_in_at 降順の最初の20名」が、実際は「created_at 降順の
--   最初の20名を last_sign_in_at で並べ替えただけ」になっていた）。
--
-- 対応:
--   ソートキー（auth.users.last_sign_in_at / kouden_entries の集計件数）を含めて
--   DB 側で order + range を行い、正しい順序のページ分の ID と全件数を返す。
--   詳細情報（profiles / 統計 / owner / plan 等）は既存 RPC を再利用して取得し、
--   呼び出し側で本関数の順序に並べ直す。
--
-- セキュリティ:
--   auth.users / 集計対象テーブルを RLS バイパスで参照するため SECURITY DEFINER とし、
--   関数内で is_admin(auth.uid()) をチェックして管理者以外からの呼び出しを拒否する。
--
-- 注意:
--   p_search は呼び出し側で escapeIlikePattern（ILIKE の % _ \ を \ でエスケープ）
--   済みの値を受け取る前提で、ILIKE ... ESCAPE '\' で照合する。

-- ============================================================================
-- 1. ユーザー一覧: last_sign_in_at で全件ソート + ページネーション
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_admin_user_ids_by_last_sign_in(
    p_search text DEFAULT NULL,
    p_filter text DEFAULT 'all',      -- 'all' | 'admin' | 'regular'
    p_sort_order text DEFAULT 'desc', -- 'asc' | 'desc'
    p_limit int DEFAULT 20,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 呼び出し元が管理者であることを必須化（RLSバイパスの保護）
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'permission denied: admin role required for get_admin_user_ids_by_last_sign_in'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    WITH filtered AS (
        SELECT
            p.id AS uid,
            u.last_sign_in_at AS lsa,
            p.created_at AS created_at
        FROM profiles p
        JOIN auth.users u ON u.id = p.id
        WHERE
            (p_search IS NULL OR p.display_name ILIKE '%' || p_search || '%' ESCAPE '\')
            AND (
                p_filter = 'all'
                OR (p_filter = 'admin'
                    AND EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = p.id))
                OR (p_filter = 'regular'
                    AND NOT EXISTS (SELECT 1 FROM admin_users a WHERE a.user_id = p.id))
            )
    ),
    counted AS (
        SELECT COUNT(*)::bigint AS total FROM filtered
    )
    -- 未ログイン (last_sign_in_at IS NULL) は「最も古い」として扱う JS 実装に合わせ、
    -- desc は NULLS LAST、asc は NULLS FIRST。created_at / uid は安定ソート用の tiebreaker。
    SELECT f.uid, c.total
    FROM filtered f
    CROSS JOIN counted c
    ORDER BY
        CASE WHEN p_sort_order = 'asc' THEN f.lsa END ASC NULLS FIRST,
        CASE WHEN p_sort_order = 'desc' THEN f.lsa END DESC NULLS LAST,
        f.created_at DESC,
        f.uid
    LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_user_ids_by_last_sign_in(text, text, text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_user_ids_by_last_sign_in(text, text, text, int, int) TO authenticated;

COMMENT ON FUNCTION public.get_admin_user_ids_by_last_sign_in(text, text, text, int, int) IS
    '管理者ユーザー一覧用: last_sign_in_at で全件ソート + ページネーションした user_id と全件数を返す。関数内で is_admin(auth.uid()) を強制。';

-- ============================================================================
-- 2. 香典帳一覧: entries_count で全件ソート + ページネーション
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_admin_kouden_ids_by_entries_count(
    p_search text DEFAULT NULL,
    p_status text DEFAULT 'all',      -- 'all' | 'active' | 'archived' | 'inactive'
    p_sort_order text DEFAULT 'desc', -- 'asc' | 'desc'
    p_limit int DEFAULT 20,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 呼び出し元が管理者であることを必須化（RLSバイパスの保護）
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'permission denied: admin role required for get_admin_kouden_ids_by_entries_count'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    WITH base AS (
        SELECT k.id AS kid
        FROM koudens k
        WHERE
            (p_search IS NULL OR k.title ILIKE '%' || p_search || '%' ESCAPE '\')
            AND (p_status = 'all' OR k.status::text = p_status)
    ),
    filtered AS (
        SELECT
            b.kid,
            (SELECT COUNT(*)::bigint FROM kouden_entries ke WHERE ke.kouden_id = b.kid) AS ecount
        FROM base b
    ),
    counted AS (
        SELECT COUNT(*)::bigint AS total FROM filtered
    )
    SELECT f.kid, c.total
    FROM filtered f
    CROSS JOIN counted c
    ORDER BY
        CASE WHEN p_sort_order = 'asc' THEN f.ecount END ASC,
        CASE WHEN p_sort_order = 'desc' THEN f.ecount END DESC,
        f.kid
    LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_kouden_ids_by_entries_count(text, text, text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_kouden_ids_by_entries_count(text, text, text, int, int) TO authenticated;

COMMENT ON FUNCTION public.get_admin_kouden_ids_by_entries_count(text, text, text, int, int) IS
    '管理者香典帳一覧用: entries_count で全件ソート + ページネーションした kouden_id と全件数を返す。関数内で is_admin(auth.uid()) を強制。';
