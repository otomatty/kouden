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
--
-- セキュリティ設計:
--   - **`plan_id` はクライアントから受け取らない**。`authenticated` ロールに
--     EXECUTE を許可するため、引数で `plan_id` を受け取ると悪意あるユーザーが
--     直接 RPC を呼び出して有料プラン ID を指定し、無料で香典帳を作成できて
--     しまう脆弱性につながる。この RPC は **無料プラン専用** とし、`plans` から
--     `code = 'free'` の ID を内部で解決する。有料プラン経由の香典帳作成は
--     決済済みを Stripe Webhook 経由で検証する
--     `process_stripe_checkout_completed` RPC のみで行われる。
--   - `SECURITY INVOKER` を採用。RLS 上、`authenticated` ロールは
--       * `koudens` INSERT: `unified_kouden_insert` (`owner_id = auth.uid()`) で許可
--       * `kouden_roles` INSERT (トリガ内): `kouden_roles_insert`
--         (`koudens.owner_id = auth.uid()` の EXISTS) で許可
--     のいずれもパスする。`kouden_members` INSERT (トリガ `add_kouden_owner` 内)
--     は当該トリガ自体が `SECURITY DEFINER` のため RLS を介さない。
--     よって `SECURITY DEFINER` で関数全体を権限昇格する必要は無く、最小権限の
--     `SECURITY INVOKER` で十分。

CREATE OR REPLACE FUNCTION public.create_kouden_with_owner(
    p_title text,
    p_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_plan_id uuid;
    v_kouden_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'authentication_required'
            USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;

    -- 無料プランの ID を関数内部で解決する (クライアントからは受け取らない)。
    SELECT id INTO v_plan_id
    FROM public.plans
    WHERE code = 'free'
    LIMIT 1;

    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'free_plan_not_found'
            USING ERRCODE = 'P0002'; -- no_data_found
    END IF;

    -- koudens への INSERT。AFTER INSERT トリガが同一トランザクション内で
    --   - create_default_kouden_roles_trigger → kouden_roles (editor/viewer)
    --   - trigger_add_kouden_owner          → kouden_members (owner = editor)
    -- を埋めるため、関数戻り時点では関連レコードが揃っている。
    INSERT INTO public.koudens (title, description, owner_id, created_by, plan_id)
    VALUES (p_title, p_description, v_user_id, v_user_id, v_plan_id)
    RETURNING id INTO v_kouden_id;

    RETURN v_kouden_id;
END;
$$;

-- 認証済みユーザーのみが実行可能 (RLS は通常通り `koudens` 側のポリシーで担保)
REVOKE ALL ON FUNCTION public.create_kouden_with_owner(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_kouden_with_owner(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_kouden_with_owner(text, text) TO authenticated, service_role;
