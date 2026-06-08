-- 2026-06-08: 招待受諾のアトミック化用 RPC 関数
-- Issue: https://github.com/otomatty/kouden/issues/113
--
-- 背景:
--   `acceptInvitation` Server Action (src/app/_actions/invitations.ts) では
--   以下の処理が非アトミックに実行されていた:
--     1. 招待トークンを SELECT
--     2. status / expires_at / used_count を check
--     3. 既存メンバーを check
--     4. kouden_members へ INSERT
--     5. used_count を +1、枠が尽きたら status='accepted' に UPDATE
--
--   ステップ 2〜5 の間に他セッションが同じ招待を受諾するレースが成立し、
--   `max_uses` 制限のある招待が上限を超えて消化される / used_count が
--   max_uses を超えてカウントされる / 二重 INSERT で uniq violation が
--   起こり得た。
--
-- 本マイグレーションでは:
--   - 一連の処理を単一の Postgres 関数 (= 1トランザクション) にまとめる
--   - `select ... for update` で招待行をロックし、同一トークンの同時受諾を直列化する
--   - kouden_members への INSERT は `on conflict (kouden_id, user_id) do nothing`
--     とし、レース時の二重 INSERT を握りつぶす (実際に挿入できたかで分岐)
--   - 失敗ケースは Server Action 側が KoudenError にマップできるよう、安定した
--     メッセージトークン (invitation_not_found / invitation_not_pending /
--     invitation_expired / invitation_max_uses_reached / already_member) と
--     SQLSTATE で raise する
--
-- 呼び出し元は service-role (admin client) のみを想定。
--   - kouden_invitations は RLS で匿名/他人からの SELECT を禁止している
--   - kouden_members への INSERT は所有者のみ許可するポリシーのため、招待経由の
--     自分自身の追加もサーバー側で検証してから service-role で実施する
-- そのため authenticated/anon からの実行は許可しない (EXECUTE を REVOKE)。
--
-- 認証ユーザー (auth.uid()) は service-role セッションでは取得できないため、
-- 受諾するユーザー ID は呼び出し元が p_user_id として渡す。Server Action 側で
-- 通常クライアントの auth.getUser() から取得した値のみを渡す (クライアント入力は信用しない)。

-- ------------------------------------------------------------------------
-- 1. 壊れている旧 accept_invitation を削除する
-- ------------------------------------------------------------------------
-- 旧関数 (20250128134809_remote_schema.sql) は v_invitation.invitation_type を
-- 参照しているが、kouden_invitations テーブルに invitation_type カラムは存在せず、
-- 実行すれば確実に失敗する。アプリからの呼び出しも無い (Server Action が手続きを
-- 自前で展開していた) ため、ここで破棄して新しい RPC に置き換える。
DROP FUNCTION IF EXISTS public.accept_invitation(uuid, uuid);

-- ------------------------------------------------------------------------
-- 2. アトミックな招待受諾用 RPC
-- ------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_invitation_atomic(
    p_token uuid,
    p_user_id uuid
)
RETURNS void
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
    -- 1. 招待行をロックして取得 (FOR UPDATE で同一トークンの同時受諾を直列化)
    SELECT * INTO v_invitation
    FROM public.kouden_invitations
    WHERE invitation_token = p_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'invitation_not_found'
            USING ERRCODE = 'P0002'; -- no_data_found
    END IF;

    -- 2. 招待の有効性チェック
    IF v_invitation.status <> 'pending' THEN
        RAISE EXCEPTION 'invitation_not_pending'
            USING ERRCODE = 'P0001'; -- raise_exception
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

    -- 3. メンバー追加 (招待の created_by を added_by として記録する)。
    --    ロック後でも別トークン経由の同時受諾などで既メンバーになり得るため、
    --    on conflict do nothing でレースを握りつぶし、挿入できたかで分岐する。
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

    -- 挿入できなかった = 既にメンバー。used_count は増やさず ALREADY_EXISTS で返す。
    IF v_inserted_id IS NULL THEN
        RAISE EXCEPTION 'already_member'
            USING ERRCODE = '23505'; -- unique_violation
    END IF;

    -- 4. 招待の使用回数を更新。
    --    マルチユーズ招待 (max_uses > 1 もしくは max_uses IS NULL) は、枠が残る間
    --    status='pending' のままにする (getInvitation が pending のみ返すため、
    --    初回受諾で 'accepted' にすると 2 人目以降がトークンを使えなくなる)。
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

-- service-role のみが実行可能 (admin client 経由で呼び出す想定)
REVOKE ALL ON FUNCTION public.accept_invitation_atomic(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_invitation_atomic(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation_atomic(uuid, uuid) TO service_role;
