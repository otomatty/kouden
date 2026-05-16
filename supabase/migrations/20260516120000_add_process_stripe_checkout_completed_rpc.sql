-- 2026-05-16: Stripe Webhook のアトミック化用 RPC 関数
-- Issue: https://github.com/otomatty/kouden/issues/38
--
-- 背景:
--   `checkout.session.completed` Webhook (src/app/api/stripe/webhook/route.ts)
--   では以下の3操作が非アトミックに実行されており、途中失敗時に
--   「購入レコードはあるが kouden が未更新」「kouden は作成されたが購入が記録されない」
--   といったデータ不整合が起こり得る。
--     1. koudens を必要に応じて INSERT
--     2. kouden_purchases に INSERT
--     3. koudens.plan_id / status を UPDATE
--
-- 本マイグレーションでは:
--   - 3操作を単一の Postgres 関数 (= 1トランザクション) にまとめてロールバック可能にする
--   - `stripe_session_id` を冪等性キーとして使い、Stripe Webhook の再試行に対応
--   - `stripe_session_id` に部分ユニーク制約を追加してDB側でも重複登録を防ぐ

-- ------------------------------------------------------------------------
-- 1. 既存データの不整合チェック後、stripe_session_id にユニーク部分インデックス
-- ------------------------------------------------------------------------
-- NOT NULL の値に対してのみユニーク性を要求 (古い手動投入レコードでは NULL のまま)
CREATE UNIQUE INDEX IF NOT EXISTS uq_kouden_purchases_stripe_session_id
    ON public.kouden_purchases (stripe_session_id)
    WHERE stripe_session_id IS NOT NULL;


-- ------------------------------------------------------------------------
-- 2. アトミックな checkout 処理用 RPC
-- ------------------------------------------------------------------------
-- 戻り値:
--   purchase_id      ... 該当 (新規または既存) の kouden_purchases.id
--   is_new_purchase  ... 今回新規に INSERT したかどうか (true=新規, false=冪等再実行)
--
-- 失敗ケース:
--   - 指定 plan_code のプランが存在しない → 例外 (ERRCODE 'P0002')
--
-- 呼び出し元は service-role (Webhook の admin client) のみを想定。
-- authenticated/anon からの実行は許可しない (EXECUTE を REVOKE)。

CREATE OR REPLACE FUNCTION public.process_stripe_checkout_completed(
    p_kouden_id uuid,
    p_user_id uuid,
    p_plan_code text,
    p_title text,
    p_description text,
    p_expected_count integer,
    p_amount_paid integer,
    p_stripe_session_id text
)
RETURNS TABLE (
    purchase_id uuid,
    is_new_purchase boolean
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_plan_id uuid;
    v_existing_purchase_id uuid;
    v_new_purchase_id uuid;
BEGIN
    -- プラン解決
    SELECT id INTO v_plan_id FROM public.plans WHERE code = p_plan_code;
    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'plan_not_found: %', p_plan_code
            USING ERRCODE = 'P0002';
    END IF;

    -- 冪等性チェック: 同じ Stripe session で既に処理済みなら早期 return
    -- (Stripe は同一 event を複数回送ることがあるため必須)
    IF p_stripe_session_id IS NOT NULL THEN
        SELECT id INTO v_existing_purchase_id
        FROM public.kouden_purchases
        WHERE stripe_session_id = p_stripe_session_id
        LIMIT 1;

        IF v_existing_purchase_id IS NOT NULL THEN
            -- 念のため kouden 側の状態 (plan_id / status) を冪等に整える
            UPDATE public.koudens
            SET plan_id = v_plan_id,
                status  = 'active'
            WHERE id = p_kouden_id
              AND (plan_id IS DISTINCT FROM v_plan_id OR status IS DISTINCT FROM 'active');

            purchase_id := v_existing_purchase_id;
            is_new_purchase := false;
            RETURN NEXT;
            RETURN;
        END IF;
    END IF;

    -- Step 1: koudens を upsert
    --   - 新規購入フロー: kouden がまだ存在しない (purchaseKouden 経由) → INSERT
    --   - アップグレードフロー: 既存 kouden → plan_id と status のみ更新
    INSERT INTO public.koudens (id, title, description, owner_id, created_by, plan_id, status)
    VALUES (
        p_kouden_id,
        COALESCE(p_title, ''),
        COALESCE(p_description, ''),
        p_user_id,
        p_user_id,
        v_plan_id,
        'active'
    )
    ON CONFLICT (id) DO UPDATE
        SET plan_id = EXCLUDED.plan_id,
            status  = 'active';
    -- title/description は既存値を温存 (upgrade 時に上書きしない)

    -- Step 2: 購入履歴を挿入
    INSERT INTO public.kouden_purchases (
        kouden_id,
        user_id,
        plan_id,
        expected_count,
        amount_paid,
        stripe_session_id
    )
    VALUES (
        p_kouden_id,
        p_user_id,
        v_plan_id,
        p_expected_count,
        p_amount_paid,
        p_stripe_session_id
    )
    RETURNING id INTO v_new_purchase_id;

    purchase_id := v_new_purchase_id;
    is_new_purchase := true;
    RETURN NEXT;
    RETURN;
END;
$$;

-- service-role のみが実行可能 (Webhook 経由の admin client から呼び出す想定)
REVOKE ALL ON FUNCTION public.process_stripe_checkout_completed(
    uuid, uuid, text, text, text, integer, integer, text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_stripe_checkout_completed(
    uuid, uuid, text, text, text, integer, integer, text
) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_stripe_checkout_completed(
    uuid, uuid, text, text, text, integer, integer, text
) TO service_role;
