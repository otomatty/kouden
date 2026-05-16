-- 2026-05-16: Critical security fixes for review items C-2 / C-3 / C-6
--
-- このマイグレーションは "/security-review" レビューで Critical と判断された
-- 以下の RLS 不備を是正する:
--
-- C-2 (kouden_invitations 公開SELECT):
--     旧ポリシー `invitation_link_access` は status=pending の招待を匿名含む
--     誰にでも SELECT させていた。invitation_token (UUID 秘密値) が漏れる。
--     → 削除し、招待トークンのルックアップは Server Action 側で service-role
--       クライアントを使って実施する。
--
-- C-3 (kouden_members 自由 INSERT):
--     旧ポリシー `members_management` は `added_by = auth.uid()` のみで
--     `kouden_id` / `user_id` / `role_id` を制約していなかった。
--     → 削除し、所有者のみがメンバー管理できるポリシーへ置き換え。
--       招待経由の追加は Server Action (acceptInvitation) で service-role
--       クライアントを使って実施する。
--
-- C-6 (contact_requests 系の全件SELECT):
--     `contact_requests` / `contact_request_attachments` / `contact_responses`
--     の SELECT が `to authenticated using (true)` で誰でも全件参照可能だった。
--     → 自分の問い合わせ or 管理者のみに絞る。
--     `contact_request_attachments` の `to public with check (true)` INSERT も
--     所有者限定に変更する。

-- ========================================================================
-- C-2: kouden_invitations
-- ========================================================================

DROP POLICY IF EXISTS "invitation_link_access" ON public.kouden_invitations;

-- 招待トークンによるルックアップは Server Action から service-role で実施するため、
-- 通常の `authenticated` / `anon` ロールに対しては SELECT 権限を持たせない。
-- 既存の "owner_invitation_access" (所有者は管理可能) はそのまま残す。


-- ========================================================================
-- C-3: kouden_members
-- ========================================================================

DROP POLICY IF EXISTS "members_management" ON public.kouden_members;

-- 所有者のみが自身の香典帳のメンバーを CRUD できる
CREATE POLICY "members_owner_manage" ON public.kouden_members
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.koudens k
            WHERE k.id = kouden_members.kouden_id
              AND (k.owner_id = auth.uid() OR k.created_by = auth.uid())
        )
    )
    WITH CHECK (
        added_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.koudens k
            WHERE k.id = kouden_members.kouden_id
              AND (k.owner_id = auth.uid() OR k.created_by = auth.uid())
        )
    );

-- ユーザーは自分自身のメンバーシップを抜けることができる（自分の行を削除）
CREATE POLICY "members_self_leave" ON public.kouden_members
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());


-- ========================================================================
-- C-6: contact_requests / contact_request_attachments / contact_responses
-- ========================================================================

-- contact_requests
DROP POLICY IF EXISTS "Allow authenticated to select contact requests" ON public.contact_requests;

CREATE POLICY "Users can view own contact requests" ON public.contact_requests
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
        )
    );

-- contact_request_attachments
DROP POLICY IF EXISTS "Allow authenticated to select attachments" ON public.contact_request_attachments;
DROP POLICY IF EXISTS "Allow public to insert attachments" ON public.contact_request_attachments;

CREATE POLICY "Owners or admins can view attachments" ON public.contact_request_attachments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contact_requests cr
            WHERE cr.id = contact_request_attachments.request_id
              AND (
                  cr.user_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.admin_users au
                      WHERE au.user_id = auth.uid()
                  )
              )
        )
    );

CREATE POLICY "Owners can insert attachments" ON public.contact_request_attachments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contact_requests cr
            WHERE cr.id = contact_request_attachments.request_id
              AND cr.user_id = auth.uid()
        )
    );

-- contact_responses
DROP POLICY IF EXISTS "Allow authenticated to select responses" ON public.contact_responses;
DROP POLICY IF EXISTS "Allow authenticated to insert responses" ON public.contact_responses;

CREATE POLICY "Owners or admins can view responses" ON public.contact_responses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contact_requests cr
            WHERE cr.id = contact_responses.request_id
              AND (
                  cr.user_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.admin_users au
                      WHERE au.user_id = auth.uid()
                  )
              )
        )
    );

CREATE POLICY "Admins can insert responses" ON public.contact_responses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users au
            WHERE au.user_id = auth.uid()
        )
    );
