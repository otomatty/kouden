-- Fix infinite recursion in koudens RLS policies
-- This addresses the "infinite recursion detected in policy for relation \"koudens\"" error

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "authenticated_access" ON koudens;
DROP POLICY IF EXISTS "owner_management" ON koudens;
DROP POLICY IF EXISTS "invitation_access" ON koudens;
DROP POLICY IF EXISTS "メンバーのみ香典帳を参照可能" ON koudens;
DROP POLICY IF EXISTS "認証済みユーザーは香典帳を作成可能" ON koudens;
DROP POLICY IF EXISTS "メンバーのみ香典帳を更新可能" ON koudens;

-- Create simplified, non-recursive policies

-- 1. SELECT policy - avoid recursion by not joining with kouden_members in UPDATE context
CREATE POLICY "koudens_select_policy" ON koudens
    FOR SELECT
    TO authenticated
    USING (
        owner_id = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM kouden_members
            WHERE kouden_members.kouden_id = koudens.id
            AND kouden_members.user_id = auth.uid()
        )
    );

-- 2. INSERT policy - simple ownership check
CREATE POLICY "koudens_insert_policy" ON koudens
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND created_by = auth.uid()
    );

-- 3. UPDATE policy - direct ownership check without recursive joins
CREATE POLICY "koudens_update_policy" ON koudens
    FOR UPDATE
    TO authenticated
    USING (
        owner_id = auth.uid()
        OR created_by = auth.uid()
    )
    WITH CHECK (
        owner_id = auth.uid()
        OR created_by = auth.uid()
    );

-- 4. DELETE policy - only owners can delete
CREATE POLICY "koudens_delete_policy" ON koudens
    FOR DELETE
    TO authenticated
    USING (
        owner_id = auth.uid()
        OR created_by = auth.uid()
    );

-- 5. Public invitation access (separate from member access)
CREATE POLICY "koudens_invitation_access" ON koudens
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1
            FROM kouden_invitations
            WHERE kouden_invitations.kouden_id = koudens.id
            AND kouden_invitations.status = 'pending'
            AND kouden_invitations.expires_at > now()
            AND kouden_invitations.invitation_type = 'share'
            AND (
                kouden_invitations.max_uses IS NULL
                OR kouden_invitations.used_count < kouden_invitations.max_uses
            )
        )
    ); 