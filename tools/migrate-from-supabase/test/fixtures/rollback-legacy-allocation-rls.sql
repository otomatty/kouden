-- The deployed offering_allocations policies only check the book's created_by
-- (inspected 2026-10-18 for #183). Reduced to the INSERT policy.
CREATE ROLE authenticated;
GRANT USAGE ON SCHEMA public,auth TO authenticated;
GRANT SELECT ON public.koudens,public.offerings,public.kouden_members,public.kouden_roles TO authenticated;
GRANT SELECT,INSERT ON public.offering_allocations TO authenticated;
ALTER TABLE public.offering_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY allocation_insert ON public.offering_allocations FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.offerings o JOIN public.koudens k ON k.id=o.kouden_id
          WHERE o.id=offering_allocations.offering_id AND k.created_by=auth.uid())
);
