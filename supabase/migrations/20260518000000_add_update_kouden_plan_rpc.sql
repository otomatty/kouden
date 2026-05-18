-- 2026-05-18: プラン変更のアトミック化用 RPC 関数
-- Issue: https://github.com/otomatty/kouden/issues/114
--
-- 背景:
--   `updateKoudenPlan` Server Action (src/app/_actions/updateKoudenPlan.ts) は
--     1. koudens.plan_id の UPDATE
--     2. kouden_purchases への購入履歴 INSERT
--   を別々のクエリで実行しており、トランザクション境界が無い。手順 2 だけが
--   失敗すると「プランは新しくなったのに購入履歴が無い (= 無料アップグレード状態)」、
--   手順 1 だけが失敗すると「履歴は残ったがプランは旧のまま」というデシンクが
--   発生する。課金関連の整合性に直結するため High バグ。
--
--   commit fe87702 の process_stripe_checkout_completed と同じ
--   「2 操作を 1 つの Postgres 関数 (= 1 トランザクション) に閉じる」パターンで
--   解決する。
--
-- セキュリティ:
--   authenticated に EXECUTE を許可するため、悪意あるユーザーが他人の
--   香典帳 ID を指定して直接 RPC を呼ぶ可能性がある。これを防ぐため:
--     - RPC 内で auth.uid() による owner_id / created_by 一致検証を必ず行う
--     - amount_paid と新プラン ID は plans テーブルから内部解決し、
--       クライアント入力を信頼しない
--   `SECURITY INVOKER` を採用し RLS と二重に防御する。

CREATE OR REPLACE FUNCTION public.update_kouden_plan(
    p_kouden_id uuid,
    p_new_plan_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_new_plan_id uuid;
    v_new_price integer;
    v_current_plan_id uuid;
    v_current_price integer := 0;
    v_owner_id uuid;
    v_created_by uuid;
    v_amount integer;
    v_purchase_id uuid;
BEGIN
    -- 認証
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'authentication_required'
            USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;

    -- 新プラン解決
    SELECT id, price INTO v_new_plan_id, v_new_price
    FROM public.plans
    WHERE code = p_new_plan_code;
    IF v_new_plan_id IS NULL THEN
        RAISE EXCEPTION 'plan_not_found: %', p_new_plan_code
            USING ERRCODE = 'P0002'; -- no_data_found
    END IF;

    -- 香典帳ロック & オーナー検証
    -- FOR UPDATE で行ロックを取り、同時並行のプラン変更を直列化する。
    SELECT plan_id, owner_id, created_by
    INTO v_current_plan_id, v_owner_id, v_created_by
    FROM public.koudens
    WHERE id = p_kouden_id
    FOR UPDATE;

    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'kouden_not_found: %', p_kouden_id
            USING ERRCODE = 'P0002';
    END IF;

    IF v_owner_id <> v_user_id AND v_created_by <> v_user_id THEN
        RAISE EXCEPTION 'not_kouden_owner'
            USING ERRCODE = '42501';
    END IF;

    -- 同一プランへの変更は no-op エラーで弾く
    -- (差額 0 円の購入履歴を量産しない)
    IF v_current_plan_id = v_new_plan_id THEN
        RAISE EXCEPTION 'already_on_plan: %', p_new_plan_code
            USING ERRCODE = 'P0001'; -- raise_exception (一般)
    END IF;

    -- 現行プラン価格を解決して差額を計算
    IF v_current_plan_id IS NOT NULL THEN
        SELECT price INTO v_current_price
        FROM public.plans
        WHERE id = v_current_plan_id;
        v_current_price := COALESCE(v_current_price, 0);
    END IF;
    v_amount := v_new_price - v_current_price;

    -- Step 1: koudens.plan_id 更新
    UPDATE public.koudens
    SET plan_id = v_new_plan_id
    WHERE id = p_kouden_id;

    -- Step 2: 購入履歴を挿入
    INSERT INTO public.kouden_purchases (
        kouden_id,
        user_id,
        plan_id,
        amount_paid
    )
    VALUES (
        p_kouden_id,
        v_user_id,
        v_new_plan_id,
        v_amount
    )
    RETURNING id INTO v_purchase_id;

    RETURN v_purchase_id;
END;
$$;

-- 認証済みユーザーのみが実行可能 (RLS は通常通り koudens / kouden_purchases
-- 側のポリシーで担保しつつ、関数内 auth.uid() 検証で二重防御)
REVOKE ALL ON FUNCTION public.update_kouden_plan(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_kouden_plan(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_kouden_plan(uuid, text)
    TO authenticated, service_role;
