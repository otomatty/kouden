-- Row-level created_by grants from the repository's 20250128134809_remote_schema.sql
-- (offerings "editor_crud_access", telegrams "Users can delete telegrams if they have edit access").
-- Reduced to the clauses that matter for a former owner; requires rollback-legacy-auth.sql.
CREATE ROLE authenticated;
GRANT USAGE ON SCHEMA public,auth TO authenticated;
GRANT SELECT ON public.koudens,public.kouden_members,public.kouden_roles TO authenticated;
GRANT SELECT,DELETE ON public.offerings,public.telegrams TO authenticated;
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegrams ENABLE ROW LEVEL SECURITY;
CREATE POLICY editor_crud_access ON public.offerings FOR ALL TO authenticated USING (EXISTS (
  SELECT 1 FROM public.koudens k
    LEFT JOIN public.kouden_members m ON k.id = m.kouden_id
    LEFT JOIN public.kouden_roles r ON m.role_id = r.id
  WHERE k.id = offerings.kouden_id AND (k.owner_id = auth.uid() OR k.created_by = auth.uid()
    OR offerings.created_by = auth.uid() OR (m.user_id = auth.uid() AND r.name = 'editor'))
));
CREATE POLICY telegram_delete ON public.telegrams FOR DELETE TO authenticated USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.koudens k WHERE k.id = telegrams.kouden_id AND (k.owner_id = auth.uid() OR k.created_by = auth.uid()))
);
CREATE POLICY telegram_select ON public.telegrams FOR SELECT TO authenticated USING (true);
