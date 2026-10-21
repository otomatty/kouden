-- 2026-06-16: return_entry_records.total_amount を DB 側で原子化する
-- Issue: https://github.com/otomatty/kouden/issues/132 (関連: #128, #122)
--
-- 背景:
--   返礼情報の合計金額 (`return_entry_records.total_amount`) は
--   `return_record_items` の `price * quantity` の総和として算出される。
--   従来はアプリ層の `updateReturnRecordTotalAmount`
--   (src/app/_actions/return-records/return-record-items.ts) が
--   item の CRUD 後に「items を SELECT → reduce → 親を UPDATE」という
--   2 段 UPDATE で更新していた。
--
-- 問題:
--   - item の CRUD と `total_amount` 更新が同一トランザクションではないため、
--     途中失敗で親だけ古い合計のまま残る。
--   - 管理画面・バッチ・別 RPC など別経路から item を触ると合計がズレる
--     (#122 と同型のサイレント不整合)。
--
-- 解決:
--   `return_record_items` の INSERT / UPDATE / DELETE 後に親を再集計する
--   AFTER ROW トリガを導入する。経路に依存せず、item を変更した同一
--   トランザクション内で必ず `total_amount` が再計算されるため、
--   アプリ層に依存せず一貫性が保たれる。
--
-- セキュリティ設計:
--   - `SECURITY DEFINER` + `SET search_path = public, pg_temp` を採用。
--     合計金額の整合性はデータ不変条件であり、どのロール・経路から item を
--     変更しても親の再集計は常に成立させる必要がある。親
--     (`return_entry_records`) 側 RLS の有無に左右されず invariant を担保する。
--   - 集計対象は `return_record_items` の price * quantity のみで、
--     アプリ層 `updateReturnRecordTotalAmount` と同一セマンティクスを維持する
--     (`additional_return_amount` 等の他カラムは含めない)。

-- 再集計トリガ関数
CREATE OR REPLACE FUNCTION public.recalc_return_entry_record_total_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_record_id uuid;
BEGIN
    -- 対象の親レコード ID を決定
    IF TG_OP = 'DELETE' THEN
        v_record_id := OLD.return_record_id;
    ELSE
        v_record_id := NEW.return_record_id;
    END IF;

    -- 親 (return_entry_records) の total_amount を再集計
    UPDATE public.return_entry_records r
    SET total_amount = COALESCE((
        SELECT SUM(i.price * i.quantity)
        FROM public.return_record_items i
        WHERE i.return_record_id = v_record_id
    ), 0)
    WHERE r.id = v_record_id;

    -- UPDATE で親 (return_record_id) が付け替えられた場合は旧親も再集計
    IF TG_OP = 'UPDATE'
       AND NEW.return_record_id IS DISTINCT FROM OLD.return_record_id THEN
        UPDATE public.return_entry_records r
        SET total_amount = COALESCE((
            SELECT SUM(i.price * i.quantity)
            FROM public.return_record_items i
            WHERE i.return_record_id = OLD.return_record_id
        ), 0)
        WHERE r.id = OLD.return_record_id;
    END IF;

    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.recalc_return_entry_record_total_amount() FROM PUBLIC;

DROP TRIGGER IF EXISTS recalc_return_entry_record_total_amount_trigger
    ON public.return_record_items;

CREATE TRIGGER recalc_return_entry_record_total_amount_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.return_record_items
FOR EACH ROW
EXECUTE FUNCTION public.recalc_return_entry_record_total_amount();

-- 既存データのバックフィル: 過去の 2 段 UPDATE 失敗等で生じたズレを是正する。
-- item を持たない返礼情報は 0 に揃える。差分のある行のみ更新する。
UPDATE public.return_entry_records r
SET total_amount = COALESCE((
    SELECT SUM(i.price * i.quantity)
    FROM public.return_record_items i
    WHERE i.return_record_id = r.id
), 0)
WHERE r.total_amount IS DISTINCT FROM COALESCE((
    SELECT SUM(i.price * i.quantity)
    FROM public.return_record_items i
    WHERE i.return_record_id = r.id
), 0);
