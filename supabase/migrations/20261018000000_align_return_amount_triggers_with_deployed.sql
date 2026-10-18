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

DROP TRIGGER IF EXISTS recalc_return_entry_record_total_amount_trigger ON public.return_record_items;
DROP FUNCTION IF EXISTS public.recalc_return_entry_record_total_amount();
DROP TRIGGER IF EXISTS tr_update_return_record_total_amount ON public.return_record_items;
DROP FUNCTION IF EXISTS public.update_return_record_total_amount();

-- 以下は本番の定義を記録する。calculate_return_items_cost の分類だけ本番と異なる。

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
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.return_entry_records
    SET total_amount = public.calculate_total_amount(OLD.kouden_entry_id),
        updated_at = NOW()
    WHERE kouden_entry_id = OLD.kouden_entry_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_offering_entries_change ON public.offering_entries;
CREATE TRIGGER trigger_offering_entries_change
AFTER INSERT OR DELETE OR UPDATE ON public.offering_entries
FOR EACH ROW EXECUTE FUNCTION public.update_related_return_entries();

-- 本番では update_related_return_entries と同じ処理のトリガーがもう 1 つある。
CREATE OR REPLACE FUNCTION public.update_return_amounts_on_offering_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE public.return_entry_records
    SET total_amount = public.calculate_total_amount(NEW.kouden_entry_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE kouden_entry_id = NEW.kouden_entry_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.return_entry_records
    SET total_amount = public.calculate_total_amount(OLD.kouden_entry_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE kouden_entry_id = OLD.kouden_entry_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS tr_update_return_amounts_on_offering_change ON public.offering_entries;
CREATE TRIGGER tr_update_return_amounts_on_offering_change
AFTER INSERT OR DELETE OR UPDATE ON public.offering_entries
FOR EACH ROW EXECUTE FUNCTION public.update_return_amounts_on_offering_change();

-- 本番では IMMUTABLE と宣言されている。IMMUTABLE だと明細トリガー内で直前の変更が見えず、
-- 1 回前の合計が残るため STABLE にする（表を読む関数の正しい分類）。
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

CREATE OR REPLACE FUNCTION public.update_return_items_cost()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  target_record_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_record_id := OLD.return_record_id;
  ELSE
    target_record_id := NEW.return_record_id;
  END IF;

  UPDATE public.return_entry_records
  SET return_items_cost = public.calculate_return_items_cost(target_record_id)
  WHERE id = target_record_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_update_return_items_cost ON public.return_record_items;
CREATE TRIGGER trigger_update_return_items_cost
AFTER INSERT OR DELETE OR UPDATE ON public.return_record_items
FOR EACH ROW EXECUTE FUNCTION public.update_return_items_cost();
