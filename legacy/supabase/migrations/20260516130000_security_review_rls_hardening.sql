-- 2026-05-16: RLS ハードニング（グループA: 過剰権限ポリシーの是正）
--
-- 対象 Issue:
--   #64 koudens.basic_access が viewer の UPDATE/DELETE を許してしまっていた
--   #65 koudens_insert_policy が owner_id / created_by を強制していなかった
--   #66 kouden_entry_audit_logs INSERT が `to public with check (true)` で誰でも偽造可能
--   #67 kouden_members.members_basic_access が全件 SELECT を許していた
--   #77 profiles が anon 含む public SELECT で全件公開だった
--   #78 debug_logs INSERT に user_id 制約がなく、なりすましログ書き込みが可能だった
--
-- 全体方針:
--   - `for all` の過剰ポリシーを SELECT / INSERT / UPDATE / DELETE に分割
--   - 不要な `to public` を `to authenticated` に絞る
--   - 監査ログ系の INSERT はトリガ (SECURITY DEFINER) 経由のみとし、
--     クライアントロールの INSERT ポリシーを撤去
--
-- 注意: `*_grants` は Supabase デフォルトで anon にも与えられているが、
--   RLS で実質拒否されるため本マイグレーションでは触らない。

-- ========================================================================
-- 共通ヘルパー: kouden_members に対する自己参照の再帰 RLS を避けるため
-- SECURITY DEFINER で会員判定を行う関数を導入する。
-- ========================================================================

CREATE OR REPLACE FUNCTION public.is_kouden_member_for_current_user(p_kouden_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.kouden_members
        WHERE kouden_id = p_kouden_id
          AND user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.is_kouden_member_for_current_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_kouden_member_for_current_user(uuid) TO authenticated;

COMMENT ON FUNCTION public.is_kouden_member_for_current_user(uuid) IS
    'kouden_members RLS の自己参照を避けるため、現在の auth.uid() がメンバーかを SECURITY DEFINER で判定する。';


-- ========================================================================
-- #64 / #65: koudens
-- 旧: basic_access (for all) と owner_access (for all)、insert_policy が混在
-- 新: SELECT / INSERT / UPDATE / DELETE を明示的に分離
-- ========================================================================

DROP POLICY IF EXISTS "basic_access" ON public.koudens;
DROP POLICY IF EXISTS "koudens_insert_policy" ON public.koudens;
DROP POLICY IF EXISTS "owner_access" ON public.koudens;

-- SELECT: オーナー / 作成者 / メンバーが閲覧可能
CREATE POLICY "koudens_select_member" ON public.koudens
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid()
        OR created_by = auth.uid()
        OR public.is_kouden_member_for_current_user(id)
    );

-- INSERT: owner_id と created_by が自分自身でなければならない
-- (admin client / service-role は RLS バイパスのため有料プラン作成や
--  Stripe Webhook フローには影響しない)
CREATE POLICY "koudens_insert_self" ON public.koudens
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (
        owner_id = auth.uid()
        AND created_by = auth.uid()
    );

-- UPDATE / DELETE: オーナー / 作成者のみ
CREATE POLICY "koudens_update_owner" ON public.koudens
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid() OR created_by = auth.uid())
    WITH CHECK (owner_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "koudens_delete_owner" ON public.koudens
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid() OR created_by = auth.uid());


-- ========================================================================
-- #67: kouden_members SELECT
-- 旧: members_basic_access が全行 SELECT を許可
-- 新: 自分自身 / 同じ kouden のオーナー / 同じ kouden のメンバー のみ
-- ========================================================================

DROP POLICY IF EXISTS "members_basic_access" ON public.kouden_members;

CREATE POLICY "kouden_members_select" ON public.kouden_members
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.koudens k
            WHERE k.id = kouden_members.kouden_id
              AND (k.owner_id = auth.uid() OR k.created_by = auth.uid())
        )
        OR public.is_kouden_member_for_current_user(kouden_members.kouden_id)
    );


-- ========================================================================
-- #66: kouden_entry_audit_logs INSERT
-- 旧: to public with check (true) — anon を含む誰でも監査ログを偽造可能
-- 新: クライアントロールに対する INSERT ポリシーは持たない。
--     書き込みは log_kouden_entry_changes() トリガ (SECURITY DEFINER) のみ。
-- ========================================================================

DROP POLICY IF EXISTS "システムは監査ログを作成できる" ON public.kouden_entry_audit_logs;


-- ========================================================================
-- #77: profiles SELECT
-- 旧: to public using (true) — 未認証 (anon) でも全プロフィール SELECT 可
-- 新: authenticated のみ。
--     (auth/contact 等は admin client = service-role を使うため影響なし)
-- INSERT / UPDATE も to public を to authenticated に絞る
-- ========================================================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "profiles_authenticated_select" ON public.profiles
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "profiles_self_insert" ON public.profiles
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_self_update" ON public.profiles
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);


-- ========================================================================
-- #78: debug_logs INSERT
-- 旧: with check (true) — 任意の user_id でログ書き込み可能 (なりすまし)
-- 新: user_id = auth.uid() を強制
-- ========================================================================

DROP POLICY IF EXISTS "Allow insert debug logs" ON public.debug_logs;

CREATE POLICY "debug_logs_self_insert" ON public.debug_logs
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
