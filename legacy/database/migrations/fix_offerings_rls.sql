-- Consolidate RLS policies for public.offerings

-- Drop conflicting old policies
DROP POLICY IF EXISTS "Users can view offerings of their koudens" ON public.offerings;
DROP POLICY IF EXISTS "Users can insert offerings" ON public.offerings;
DROP POLICY IF EXISTS "Users can update offerings of their koudens" ON public.offerings;
DROP POLICY IF EXISTS "Users can delete offerings of their koudens" ON public.offerings;

-- Drop new policies to ensure a clean slate
DROP POLICY IF EXISTS "viewer_read_access" ON public.offerings;
DROP POLICY IF EXISTS "editor_crud_access" ON public.offerings;

-- Create consolidated policies for offerings
CREATE POLICY "viewer_read_access" ON public.offerings
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM koudens k
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE k.id = offerings.kouden_id
        AND (
            k.owner_id = (SELECT auth.uid())
            OR k.created_by = (SELECT auth.uid())
            OR (
                m.user_id = (SELECT auth.uid())
                AND (
                    r.name = 'viewer'
                    OR r.name = 'editor'
                    OR 'entry.read' = ANY(r.permissions)
                )
            )
        )
    ));

CREATE POLICY "editor_crud_access" ON public.offerings
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM koudens k
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE k.id = offerings.kouden_id
        AND (
            k.owner_id = (SELECT auth.uid())
            OR k.created_by = (SELECT auth.uid())
            OR offerings.created_by = (SELECT auth.uid())
            OR (
                m.user_id = (SELECT auth.uid())
                AND (
                    r.name = 'editor'
                    OR 'entry.write' = ANY(r.permissions)
                )
            )
        )
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM koudens k
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE k.id = offerings.kouden_id
        AND (
            k.owner_id = (SELECT auth.uid())
            OR k.created_by = (SELECT auth.uid())
            OR (
                m.user_id = (SELECT auth.uid())
                AND (
                    r.name = 'editor'
                    OR 'entry.write' = ANY(r.permissions)
                )
            )
        )
    ));


-- Consolidate RLS policies for public.offering_photos

-- Drop policies to ensure a clean slate
DROP POLICY IF EXISTS "viewer_read_access" ON public.offering_photos;
DROP POLICY IF EXISTS "editor_crud_access" ON public.offering_photos;

-- Create consolidated policies for offering_photos
CREATE POLICY "viewer_read_access" ON public.offering_photos
    FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM offerings o
        JOIN koudens k ON o.kouden_id = k.id
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE o.id = offering_photos.offering_id
        AND (
            k.owner_id = (SELECT auth.uid())
            OR k.created_by = (SELECT auth.uid())
            OR o.created_by = (SELECT auth.uid())
            OR (
                m.user_id = (SELECT auth.uid())
                AND (
                    r.name = 'viewer'
                    OR r.name = 'editor'
                    OR 'entry.read' = ANY(r.permissions)
                )
            )
        )
    ));

CREATE POLICY "editor_crud_access" ON public.offering_photos
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM offerings o
        JOIN koudens k ON o.kouden_id = k.id
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE o.id = offering_photos.offering_id
        AND (
            k.owner_id = (SELECT auth.uid())
            OR k.created_by = (SELECT auth.uid())
            OR o.created_by = (SELECT auth.uid())
            OR (
                m.user_id = (SELECT auth.uid())
                AND (
                    r.name = 'editor'
                    OR 'entry.write' = ANY(r.permissions)
                )
            )
        )
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM offerings o
        JOIN koudens k ON o.kouden_id = k.id
        LEFT JOIN kouden_members m ON k.id = m.kouden_id
        LEFT JOIN kouden_roles r ON m.role_id = r.id
        WHERE o.id = offering_photos.offering_id
        AND (
            k.owner_id = (SELECT auth.uid())
            OR k.created_by = (SELECT auth.uid())
            OR (
                m.user_id = (SELECT auth.uid())
                AND (
                    r.name = 'editor'
                    OR 'entry.write' = ANY(r.permissions)
                )
            )
        )
    )); 