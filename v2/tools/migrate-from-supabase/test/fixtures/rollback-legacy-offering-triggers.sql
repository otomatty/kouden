-- has_offering trigger on offering_entries, from the repository's 20250128134809_remote_schema.sql.
-- The deployed DB has it per the #188 investigation (2026-10-18). Return totals are recalculated by
-- 20261018000000_align_return_amount_triggers_with_deployed.sql, which the tests apply separately.
CREATE FUNCTION public.update_has_offering_flag() RETURNS trigger LANGUAGE plpgsql AS $f$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.kouden_entries SET has_offering = true WHERE id = NEW.kouden_entry_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.kouden_entries SET has_offering = EXISTS (
      SELECT 1 FROM public.offering_entries WHERE kouden_entry_id = OLD.kouden_entry_id AND id != OLD.id
    ) WHERE id = OLD.kouden_entry_id;
  END IF;
  RETURN NULL;
END;
$f$;
CREATE TRIGGER update_has_offering_flag_trigger AFTER INSERT OR DELETE ON public.offering_entries
FOR EACH ROW EXECUTE FUNCTION public.update_has_offering_flag();
