-- 2026-10-18: 弔電・供物の紐づけの RLS をロール名 `editor` / `viewer` に揃える
-- Issue: https://github.com/otomatty/kouden/issues/184
--
-- 本番 DB の `kouden_roles` の名前は `editor` / `viewer` だけで、作成トリガー
-- `create_default_kouden_roles` もこの名前で作る。ところが次の 4 件のポリシーは
-- 日本語の `編集者` / `閲覧者` を要求しており、オーナー・作成者以外のメンバーに権限が出ない。
--   - telegrams の INSERT / UPDATE / DELETE: `r.name = '編集者'`
--   - offering_entries の SELECT: `r.name = ANY ('{編集者,閲覧者}')`
--
-- ほかのテーブル（kouden_entries・offerings・offering_photos など）と同じく、
-- ロール名と権限配列（`entry.write` / `entry.read`）で判定する形に作り直す。
-- 条件のそれ以外の部分（created_by・オーナー・作成者）は本番の定義のまま。データは変えない。

DROP POLICY IF EXISTS "Users can insert telegrams if they have edit access" ON public.telegrams;
CREATE POLICY "Users can insert telegrams if they have edit access"
ON public.telegrams
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.kouden_members m
    JOIN public.kouden_roles r ON m.role_id = r.id
    WHERE m.kouden_id = telegrams.kouden_id
      AND m.user_id = (SELECT auth.uid())
      AND (r.name = 'editor' OR 'entry.write' = ANY (r.permissions))
  )
  OR EXISTS (
    SELECT 1
    FROM public.koudens
    WHERE koudens.id = telegrams.kouden_id
      AND (koudens.owner_id = (SELECT auth.uid()) OR koudens.created_by = (SELECT auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can update telegrams if they have edit access" ON public.telegrams;
CREATE POLICY "Users can update telegrams if they have edit access"
ON public.telegrams
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.kouden_members m
    JOIN public.kouden_roles r ON m.role_id = r.id
    WHERE m.kouden_id = telegrams.kouden_id
      AND m.user_id = (SELECT auth.uid())
      AND (r.name = 'editor' OR 'entry.write' = ANY (r.permissions))
  )
  OR EXISTS (
    SELECT 1
    FROM public.koudens
    WHERE koudens.id = telegrams.kouden_id
      AND (koudens.owner_id = (SELECT auth.uid()) OR koudens.created_by = (SELECT auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can delete telegrams if they have edit access" ON public.telegrams;
CREATE POLICY "Users can delete telegrams if they have edit access"
ON public.telegrams
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  created_by = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.kouden_members m
    JOIN public.kouden_roles r ON m.role_id = r.id
    WHERE m.kouden_id = telegrams.kouden_id
      AND m.user_id = (SELECT auth.uid())
      AND (r.name = 'editor' OR 'entry.write' = ANY (r.permissions))
  )
  OR EXISTS (
    SELECT 1
    FROM public.koudens
    WHERE koudens.id = telegrams.kouden_id
      AND (koudens.owner_id = (SELECT auth.uid()) OR koudens.created_by = (SELECT auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can view offering entries" ON public.offering_entries;
CREATE POLICY "Users can view offering entries"
ON public.offering_entries
AS PERMISSIVE
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.kouden_entries ke
    JOIN public.koudens k ON k.id = ke.kouden_id
    WHERE ke.id = offering_entries.kouden_entry_id
      AND (
        k.owner_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.kouden_members m
          JOIN public.kouden_roles r ON m.role_id = r.id
          WHERE m.kouden_id = k.id
            AND m.user_id = (SELECT auth.uid())
            AND (r.name IN ('editor', 'viewer') OR 'entry.read' = ANY (r.permissions))
        )
      )
  )
);
