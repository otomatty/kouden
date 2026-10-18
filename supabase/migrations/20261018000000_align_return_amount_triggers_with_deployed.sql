-- 2026-10-18: 返礼金額のトリガーを本番の定義に揃える
-- Issue: https://github.com/otomatty/kouden/issues/168
--
-- 2026-10-18 に本番 DB の関数・トリガー定義を読み取り確認した結果:
--   - `return_entry_records.total_amount` は「香典額 + 紐づく供物の price * quantity」。
--     BEFORE トリガー `tr_update_return_entry_total_amount` と、`offering_entries` の
--     変更時の AFTER トリガーが `calculate_total_amount` で再計算する。
--   - 返礼明細 (`return_record_items`) の合計は `return_items_cost` に入る。
--     生成列 `profit_loss = total_amount - return_items_cost` はこの前提で成り立つ。
--
-- このマイグレーションは次の 2 点を解消し、上記の定義をリポジトリに記録する。
--   1. 20260616000000_atomize_return_entry_record_total_amount.sql は本番に未適用で、
--      `total_amount` を明細合計にするため本番の意味と矛盾する。トリガーと関数を削除する。
--   2. 本番の `tr_update_return_record_total_amount` は存在しない `public.return_records` を
--      更新するため、`return_record_items` の追加・更新・削除がすべて失敗する。削除する。
--
-- あわせて、本番の再計算の漏れを直す（本番との違いはこの 4 点）。
--   - `calculate_return_items_cost` は IMMUTABLE だと明細トリガー内で直前の変更が見えないため STABLE にする。
--   - 香典額 (`kouden_entries.amount`) と供物の価格・数量の変更でも `total_amount` を再計算する。
--   - 供物の紐付け・返礼明細の親を付け替えたとき、元の親も再計算する。
--   - 同じ処理の供物トリガー `tr_update_return_amounts_on_offering_change` を 1 つにまとめる。

DROP TRIGGER IF EXISTS recalc_return_entry_record_total_amount_trigger ON public.return_record_items;
DROP FUNCTION IF EXISTS public.recalc_return_entry_record_total_amount();
DROP TRIGGER IF EXISTS tr_update_return_record_total_amount ON public.return_record_items;
DROP FUNCTION IF EXISTS public.update_return_record_total_amount();


CREATE OR REPLACE FUNCTION public.calculate_total_amount(p_kouden_entry_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
DECLARE
  v_kouden_amount NUMERIC;
  v_offering_total NUMERIC;
BEGIN
  SELECT amount INTO v_kouden_amount
  FROM public.kouden_entries
  WHERE id = p_kouden_entry_id;

  SELECT COALESCE(SUM(o.price * o.quantity), 0) INTO v_offering_total
  FROM public.offering_entries oe
  JOIN public.offerings o ON oe.offering_id = o.id
  WHERE oe.kouden_entry_id = p_kouden_entry_id;

  RETURN COALESCE(v_kouden_amount, 0) + COALESCE(v_offering_total, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_update_return_entry_total_amount()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.total_amount := public.calculate_total_amount(NEW.kouden_entry_id);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tr_update_return_entry_total_amount ON public.return_entry_records;
CREATE TRIGGER tr_update_return_entry_total_amount
BEFORE INSERT OR UPDATE ON public.return_entry_records
FOR EACH ROW EXECUTE FUNCTION public.trigger_update_return_entry_total_amount();

CREATE OR REPLACE FUNCTION public.update_related_return_entries()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE public.return_entry_records
    SET total_amount = public.calculate_total_amount(NEW.kouden_entry_id),
        updated_at = NOW()
    WHERE kouden_entry_id = NEW.kouden_entry_id;
  END IF;

  -- 削除と、別の香典への付け替えでは元の香典も再計算する。
  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND OLD.kouden_entry_id IS DISTINCT FROM NEW.kouden_entry_id) THEN
    UPDATE public.return_entry_records
    SET total_amount = public.calculate_total_amount(OLD.kouden_entry_id),
        updated_at = NOW()
    WHERE kouden_entry_id = OLD.kouden_entry_id;
  END IF;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_offering_entries_change ON public.offering_entries;
CREATE TRIGGER trigger_offering_entries_change
AFTER INSERT OR DELETE OR UPDATE ON public.offering_entries
FOR EACH ROW EXECUTE FUNCTION public.update_related_return_entries();

-- 本番では同じ処理のトリガーがもう 1 つあり、二重に再計算している。
DROP TRIGGER IF EXISTS tr_update_return_amounts_on_offering_change ON public.offering_entries;
DROP FUNCTION IF EXISTS public.update_return_amounts_on_offering_change();

-- 香典額・供物の価格と数量の変更でも、関係する返礼記録の total_amount を再計算する。
CREATE OR REPLACE FUNCTION public.update_return_total_on_amount_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'kouden_entries' THEN
    UPDATE public.return_entry_records
    SET total_amount = public.calculate_total_amount(NEW.id),
        updated_at = NOW()
    WHERE kouden_entry_id = NEW.id;
  ELSE
    UPDATE public.return_entry_records r
    SET total_amount = public.calculate_total_amount(r.kouden_entry_id),
        updated_at = NOW()
    WHERE r.kouden_entry_id IN (
      SELECT oe.kouden_entry_id FROM public.offering_entries oe WHERE oe.offering_id = NEW.id
    );
  END IF;
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS tr_update_return_total_on_entry_amount ON public.kouden_entries;
CREATE TRIGGER tr_update_return_total_on_entry_amount
AFTER UPDATE OF amount ON public.kouden_entries
FOR EACH ROW WHEN (OLD.amount IS DISTINCT FROM NEW.amount)
EXECUTE FUNCTION public.update_return_total_on_amount_change();

DROP TRIGGER IF EXISTS tr_update_return_total_on_offering_price ON public.offerings;
CREATE TRIGGER tr_update_return_total_on_offering_price
AFTER UPDATE OF price, quantity ON public.offerings
FOR EACH ROW WHEN (OLD.price IS DISTINCT FROM NEW.price OR OLD.quantity IS DISTINCT FROM NEW.quantity)
EXECUTE FUNCTION public.update_return_total_on_amount_change();

-- 本番では IMMUTABLE。明細トリガー内で直前の変更が見えず 1 回前の合計が残るため STABLE にする。
CREATE OR REPLACE FUNCTION public.calculate_return_items_cost(p_return_record_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(rri.price * rri.quantity)
     FROM public.return_record_items rri
     WHERE rri.return_record_id = p_return_record_id),
    0
  );
END;
$function$;

-- 同じ返礼記録への同時書き込みで合計を取りこぼさないよう、親の行ロックを取ってから
-- 次の文（READ COMMITTED では新しいスナップショット）で再計算する。
-- 1 文の UPDATE で再計算すると、ロック待ちの後も待つ前のスナップショットで集計してしまう。
-- 明細の FK 検査が親に取る KEY SHARE と衝突しないよう、FOR UPDATE ではなく FOR NO KEY UPDATE を使う。
-- total_amount は BEFORE トリガーがロック取得後に再計算するため、この対策は不要。
CREATE OR REPLACE FUNCTION public.update_return_items_cost()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  target_record_id uuid;
BEGIN
  FOR target_record_id IN
    SELECT DISTINCT unnest(ARRAY[
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.return_record_id END,
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.return_record_id END
    ]) ORDER BY 1  -- 付け替えの同時実行でデッドロックしないよう ID 順にロックする
  LOOP
    CONTINUE WHEN target_record_id IS NULL;
    PERFORM 1 FROM public.return_entry_records WHERE id = target_record_id FOR NO KEY UPDATE;
    UPDATE public.return_entry_records
    SET return_items_cost = public.calculate_return_items_cost(target_record_id)
    WHERE id = target_record_id;
  END LOOP;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_return_items_cost ON public.return_record_items;
CREATE TRIGGER trigger_update_return_items_cost
AFTER INSERT OR DELETE OR UPDATE ON public.return_record_items
FOR EACH ROW EXECUTE FUNCTION public.update_return_items_cost();

-- 20260616 を適用した環境では、そのバックフィルで total_amount が明細合計になっている。
-- 既存行を本番の定義で再計算する（差分のある行だけ更新）。
UPDATE public.return_entry_records r
SET total_amount = public.calculate_total_amount(r.kouden_entry_id),
    return_items_cost = public.calculate_return_items_cost(r.id)
WHERE r.total_amount IS DISTINCT FROM public.calculate_total_amount(r.kouden_entry_id)
   OR r.return_items_cost IS DISTINCT FROM public.calculate_return_items_cost(r.id);
