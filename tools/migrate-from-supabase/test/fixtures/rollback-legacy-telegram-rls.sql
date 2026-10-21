-- Telegram policies inspected through the Supabase connector on 2026-10-14.
CREATE ROLE authenticated;
GRANT USAGE ON SCHEMA public,auth TO authenticated;
GRANT SELECT ON public.koudens,public.kouden_members,public.kouden_roles TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.telegrams TO authenticated;
ALTER TABLE public.telegrams ENABLE ROW LEVEL SECURITY;
CREATE POLICY telegram_select ON public.telegrams FOR SELECT TO authenticated USING (
  created_by=auth.uid()
  OR EXISTS (SELECT 1 FROM public.kouden_members m WHERE m.kouden_id=telegrams.kouden_id AND m.user_id=auth.uid())
  OR EXISTS (SELECT 1 FROM public.koudens k WHERE k.id=telegrams.kouden_id AND (k.owner_id=auth.uid() OR k.created_by=auth.uid()))
);
CREATE POLICY telegram_insert ON public.telegrams FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.kouden_members m JOIN public.kouden_roles r ON r.id=m.role_id WHERE m.kouden_id=telegrams.kouden_id AND m.user_id=auth.uid() AND r.name='編集者')
  OR EXISTS (SELECT 1 FROM public.koudens k WHERE k.id=telegrams.kouden_id AND (k.owner_id=auth.uid() OR k.created_by=auth.uid()))
);
CREATE POLICY telegram_update ON public.telegrams FOR UPDATE TO authenticated USING (
  created_by=auth.uid()
  OR EXISTS (SELECT 1 FROM public.kouden_members m JOIN public.kouden_roles r ON r.id=m.role_id WHERE m.kouden_id=telegrams.kouden_id AND m.user_id=auth.uid() AND r.name='編集者')
  OR EXISTS (SELECT 1 FROM public.koudens k WHERE k.id=telegrams.kouden_id AND (k.owner_id=auth.uid() OR k.created_by=auth.uid()))
);
CREATE POLICY telegram_delete ON public.telegrams FOR DELETE TO authenticated USING (
  created_by=auth.uid()
  OR EXISTS (SELECT 1 FROM public.kouden_members m JOIN public.kouden_roles r ON r.id=m.role_id WHERE m.kouden_id=telegrams.kouden_id AND m.user_id=auth.uid() AND r.name='編集者')
  OR EXISTS (SELECT 1 FROM public.koudens k WHERE k.id=telegrams.kouden_id AND (k.owner_id=auth.uid() OR k.created_by=auth.uid()))
);
