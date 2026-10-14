-- Functions exist in the inspected DB; trigger bindings are from the repository's
-- 20250128134809_remote_schema.sql. The inspected DB currently has no audit bindings.
CREATE TABLE public.kouden_entry_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.kouden_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION public.update_kouden_entry_modified() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $f$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.last_modified_at = NOW();
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$f$;
CREATE FUNCTION public.log_kouden_entry_changes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO kouden_entry_audit_logs(entry_id,user_id,action,changes)
    VALUES (NEW.id, coalesce(current_user_id,NEW.created_by),'create',to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO kouden_entry_audit_logs(entry_id,user_id,action,changes)
    VALUES (NEW.id,coalesce(current_user_id,NEW.last_modified_by),'update',jsonb_build_object('old',to_jsonb(OLD),'new',to_jsonb(NEW)));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO kouden_entry_audit_logs(entry_id,user_id,action,changes)
    VALUES (OLD.id,coalesce(current_user_id,OLD.created_by),'delete',to_jsonb(OLD));
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$f$;
CREATE TRIGGER update_kouden_entry_modified BEFORE UPDATE ON public.kouden_entries
FOR EACH ROW EXECUTE FUNCTION public.update_kouden_entry_modified();
CREATE TRIGGER log_kouden_entry_changes AFTER INSERT OR UPDATE ON public.kouden_entries
FOR EACH ROW EXECUTE FUNCTION public.log_kouden_entry_changes();
