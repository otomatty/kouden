-- 招待承認のためのストアドプロシージャ (アトミック版)
-- Issue: https://github.com/otomatty/kouden/issues/113
-- Migration: supabase/migrations/20260608000002_add_accept_invitation_atomic_rpc.sql
--
-- Server Action (acceptInvitation) は service-role 経由で本 RPC のみを呼び出す。
-- select ... for update により同一トークンの並列受諾を直列化し、
-- kouden_members INSERT と used_count 更新を 1 トランザクションで実行する。
DROP FUNCTION IF EXISTS public.accept_invitation(uuid, uuid);

CREATE OR REPLACE FUNCTION public.accept_invitation_atomic(
    p_token UUID,
    p_user_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_invitation     public.kouden_invitations%ROWTYPE;
    v_new_used_count integer;
    v_is_exhausted   boolean;
    v_inserted_id    uuid;
BEGIN
    SELECT * INTO v_invitation
    FROM public.kouden_invitations
    WHERE invitation_token = p_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'invitation_not_found'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_invitation.status <> 'pending' THEN
        RAISE EXCEPTION 'invitation_not_pending'
            USING ERRCODE = 'P0001';
    END IF;

    IF v_invitation.expires_at < now() THEN
        RAISE EXCEPTION 'invitation_expired'
            USING ERRCODE = 'P0001';
    END IF;

    IF v_invitation.max_uses IS NOT NULL
       AND v_invitation.used_count >= v_invitation.max_uses THEN
        RAISE EXCEPTION 'invitation_max_uses_reached'
            USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.kouden_members (
        kouden_id,
        user_id,
        role_id,
        invitation_id,
        added_by
    ) VALUES (
        v_invitation.kouden_id,
        p_user_id,
        v_invitation.role_id,
        v_invitation.id,
        v_invitation.created_by
    )
    ON CONFLICT (kouden_id, user_id) DO NOTHING
    RETURNING id INTO v_inserted_id;

    IF v_inserted_id IS NULL THEN
        RAISE EXCEPTION 'already_member'
            USING ERRCODE = '23505';
    END IF;

    v_new_used_count := v_invitation.used_count + 1;
    v_is_exhausted := v_invitation.max_uses IS NOT NULL
                      AND v_new_used_count >= v_invitation.max_uses;

    UPDATE public.kouden_invitations
    SET used_count = v_new_used_count,
        status     = CASE WHEN v_is_exhausted THEN 'accepted'::invitation_status ELSE status END,
        updated_at = now()
    WHERE id = v_invitation.id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invitation_atomic(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_invitation_atomic(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation_atomic(uuid, uuid) TO service_role;
