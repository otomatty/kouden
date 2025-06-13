-- Fix RLS policies for new Supabase JWT handling
-- The old current_setting('request.jwt.claims.organization_id') is deprecated
-- Since organization_id is not in JWT yet, use membership-based approach

-- 1. Create helper function in public schema (not auth schema due to permissions)
CREATE OR REPLACE FUNCTION public.get_user_organization_ids() 
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT organization_id 
    FROM common.organization_members 
    WHERE user_id = auth.uid()
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 2. Drop all existing policies that use the deprecated format

-- Common schema policies
DROP POLICY IF EXISTS customers_select ON common.customers;
DROP POLICY IF EXISTS customers_insert ON common.customers;
DROP POLICY IF EXISTS customers_update ON common.customers;
DROP POLICY IF EXISTS customers_delete ON common.customers;

DROP POLICY IF EXISTS inventory_select ON common.inventory;
DROP POLICY IF EXISTS inventory_insert ON common.inventory;
DROP POLICY IF EXISTS inventory_update ON common.inventory;
DROP POLICY IF EXISTS inventory_delete ON common.inventory;

-- Funeral schema policies
DROP POLICY IF EXISTS cases_select ON funeral.cases;
DROP POLICY IF EXISTS cases_insert ON funeral.cases;
DROP POLICY IF EXISTS cases_update ON funeral.cases;
DROP POLICY IF EXISTS cases_delete ON funeral.cases;

DROP POLICY IF EXISTS attendees_select ON funeral.attendees;
DROP POLICY IF EXISTS attendees_insert ON funeral.attendees;
DROP POLICY IF EXISTS attendees_update ON funeral.attendees;
DROP POLICY IF EXISTS attendees_delete ON funeral.attendees;

DROP POLICY IF EXISTS donations_select ON funeral.donations;
DROP POLICY IF EXISTS donations_insert ON funeral.donations;
DROP POLICY IF EXISTS donations_update ON funeral.donations;
DROP POLICY IF EXISTS donations_delete ON funeral.donations;

DROP POLICY IF EXISTS customer_details_select ON funeral.customer_details;
DROP POLICY IF EXISTS customer_details_insert ON funeral.customer_details;
DROP POLICY IF EXISTS customer_details_update ON funeral.customer_details;
DROP POLICY IF EXISTS customer_details_delete ON funeral.customer_details;

DROP POLICY IF EXISTS contacts_select ON funeral.contacts;
DROP POLICY IF EXISTS contacts_insert ON funeral.contacts;
DROP POLICY IF EXISTS contacts_update ON funeral.contacts;
DROP POLICY IF EXISTS contacts_delete ON funeral.contacts;

DROP POLICY IF EXISTS quotes_select ON funeral.quotes;
DROP POLICY IF EXISTS quotes_insert ON funeral.quotes;
DROP POLICY IF EXISTS quotes_update ON funeral.quotes;
DROP POLICY IF EXISTS quotes_delete ON funeral.quotes;

DROP POLICY IF EXISTS invoices_select ON funeral.invoices;
DROP POLICY IF EXISTS invoices_insert ON funeral.invoices;
DROP POLICY IF EXISTS invoices_update ON funeral.invoices;
DROP POLICY IF EXISTS invoices_delete ON funeral.invoices;

DROP POLICY IF EXISTS material_orders_select ON funeral.material_orders;
DROP POLICY IF EXISTS material_orders_insert ON funeral.material_orders;
DROP POLICY IF EXISTS material_orders_update ON funeral.material_orders;
DROP POLICY IF EXISTS material_orders_delete ON funeral.material_orders;

DROP POLICY IF EXISTS tasks_select ON funeral.tasks;
DROP POLICY IF EXISTS tasks_insert ON funeral.tasks;
DROP POLICY IF EXISTS tasks_update ON funeral.tasks;
DROP POLICY IF EXISTS tasks_delete ON funeral.tasks;

DROP POLICY IF EXISTS reservations_select ON funeral.reservations;
DROP POLICY IF EXISTS reservations_insert ON funeral.reservations;
DROP POLICY IF EXISTS reservations_update ON funeral.reservations;
DROP POLICY IF EXISTS reservations_delete ON funeral.reservations;

-- Gift schema policies
DROP POLICY IF EXISTS loyalty_select ON gift.loyalty_points;
DROP POLICY IF EXISTS loyalty_insert ON gift.loyalty_points;
DROP POLICY IF EXISTS loyalty_update ON gift.loyalty_points;
DROP POLICY IF EXISTS loyalty_delete ON gift.loyalty_points;

DROP POLICY IF EXISTS tiers_select ON gift.tiers;
DROP POLICY IF EXISTS tiers_insert ON gift.tiers;
DROP POLICY IF EXISTS tiers_update ON gift.tiers;
DROP POLICY IF EXISTS tiers_delete ON gift.tiers;

DROP POLICY IF EXISTS campaigns_select ON gift.marketing_campaigns;
DROP POLICY IF EXISTS campaigns_insert ON gift.marketing_campaigns;
DROP POLICY IF EXISTS campaigns_update ON gift.marketing_campaigns;
DROP POLICY IF EXISTS campaigns_delete ON gift.marketing_campaigns;

DROP POLICY IF EXISTS products_select ON gift.products;
DROP POLICY IF EXISTS products_insert ON gift.products;
DROP POLICY IF EXISTS products_update ON gift.products;
DROP POLICY IF EXISTS products_delete ON gift.products;

DROP POLICY IF EXISTS orders_select ON gift.orders;
DROP POLICY IF EXISTS orders_insert ON gift.orders;
DROP POLICY IF EXISTS orders_update ON gift.orders;
DROP POLICY IF EXISTS orders_delete ON gift.orders;

DROP POLICY IF EXISTS shipping_select ON gift.shipping;
DROP POLICY IF EXISTS shipping_insert ON gift.shipping;
DROP POLICY IF EXISTS shipping_update ON gift.shipping;
DROP POLICY IF EXISTS shipping_delete ON gift.shipping;

DROP POLICY IF EXISTS promotions_select ON gift.promotions;
DROP POLICY IF EXISTS promotions_insert ON gift.promotions;
DROP POLICY IF EXISTS promotions_update ON gift.promotions;
DROP POLICY IF EXISTS promotions_delete ON gift.promotions;

DROP POLICY IF EXISTS tickets_select ON gift.support_tickets;
DROP POLICY IF EXISTS tickets_insert ON gift.support_tickets;
DROP POLICY IF EXISTS tickets_update ON gift.support_tickets;
DROP POLICY IF EXISTS tickets_delete ON gift.support_tickets;

-- 3. Recreate all policies with direct membership checks (more reliable than helper function)

-- Common schema
CREATE POLICY customers_select ON common.customers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = customers.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY customers_insert ON common.customers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = customers.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY customers_update ON common.customers FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = customers.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = customers.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY customers_delete ON common.customers FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = customers.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY inventory_select ON common.inventory FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = inventory.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY inventory_insert ON common.inventory FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = inventory.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY inventory_update ON common.inventory FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = inventory.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = inventory.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY inventory_delete ON common.inventory FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = inventory.organization_id 
    AND user_id = auth.uid()
  )
);

-- Funeral schema
CREATE POLICY cases_select ON funeral.cases FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = cases.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY cases_insert ON funeral.cases FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = cases.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY cases_update ON funeral.cases FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = cases.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = cases.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY cases_delete ON funeral.cases FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = cases.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY attendees_select ON funeral.attendees FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = attendees.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY attendees_insert ON funeral.attendees FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = attendees.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY attendees_update ON funeral.attendees FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = attendees.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = attendees.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY attendees_delete ON funeral.attendees FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = attendees.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY donations_select ON funeral.donations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = donations.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY donations_insert ON funeral.donations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = donations.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY donations_update ON funeral.donations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = donations.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = donations.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY donations_delete ON funeral.donations FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = donations.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY customer_details_select ON funeral.customer_details FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = customer_details.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY customer_details_insert ON funeral.customer_details FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = customer_details.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY customer_details_update ON funeral.customer_details FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = customer_details.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = customer_details.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY customer_details_delete ON funeral.customer_details FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = customer_details.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY contacts_select ON funeral.contacts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = contacts.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY contacts_insert ON funeral.contacts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = contacts.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY contacts_update ON funeral.contacts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = contacts.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = contacts.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY contacts_delete ON funeral.contacts FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = contacts.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY quotes_select ON funeral.quotes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = quotes.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY quotes_insert ON funeral.quotes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = quotes.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY quotes_update ON funeral.quotes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = quotes.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = quotes.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY quotes_delete ON funeral.quotes FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = quotes.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY invoices_select ON funeral.invoices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = invoices.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY invoices_insert ON funeral.invoices FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = invoices.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY invoices_update ON funeral.invoices FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = invoices.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = invoices.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY invoices_delete ON funeral.invoices FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = invoices.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY material_orders_select ON funeral.material_orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = material_orders.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY material_orders_insert ON funeral.material_orders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = material_orders.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY material_orders_update ON funeral.material_orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = material_orders.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = material_orders.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY material_orders_delete ON funeral.material_orders FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = material_orders.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY tasks_select ON funeral.tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = tasks.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY tasks_insert ON funeral.tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = tasks.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY tasks_update ON funeral.tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = tasks.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = tasks.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY tasks_delete ON funeral.tasks FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = tasks.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY reservations_select ON funeral.reservations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = reservations.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY reservations_insert ON funeral.reservations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = reservations.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY reservations_update ON funeral.reservations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = reservations.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = reservations.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY reservations_delete ON funeral.reservations FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = reservations.organization_id 
    AND user_id = auth.uid()
  )
);

-- Gift schema (continuing with same pattern)
CREATE POLICY loyalty_select ON gift.loyalty_points FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = loyalty_points.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY loyalty_insert ON gift.loyalty_points FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = loyalty_points.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY loyalty_update ON gift.loyalty_points FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = loyalty_points.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = loyalty_points.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY loyalty_delete ON gift.loyalty_points FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = loyalty_points.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY tiers_select ON gift.tiers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = tiers.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY tiers_insert ON gift.tiers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = tiers.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY tiers_update ON gift.tiers FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = tiers.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = tiers.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY tiers_delete ON gift.tiers FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = tiers.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY campaigns_select ON gift.marketing_campaigns FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = marketing_campaigns.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY campaigns_insert ON gift.marketing_campaigns FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = marketing_campaigns.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY campaigns_update ON gift.marketing_campaigns FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = marketing_campaigns.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = marketing_campaigns.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY campaigns_delete ON gift.marketing_campaigns FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = marketing_campaigns.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY products_select ON gift.products FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = products.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY products_insert ON gift.products FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = products.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY products_update ON gift.products FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = products.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = products.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY products_delete ON gift.products FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = products.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY orders_select ON gift.orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = orders.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY orders_insert ON gift.orders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = orders.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY orders_update ON gift.orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = orders.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = orders.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY orders_delete ON gift.orders FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = orders.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY shipping_select ON gift.shipping FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = shipping.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY shipping_insert ON gift.shipping FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = shipping.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY shipping_update ON gift.shipping FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = shipping.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = shipping.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY shipping_delete ON gift.shipping FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = shipping.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY promotions_select ON gift.promotions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = promotions.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY promotions_insert ON gift.promotions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = promotions.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY promotions_update ON gift.promotions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = promotions.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = promotions.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY promotions_delete ON gift.promotions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = promotions.organization_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY tickets_select ON gift.support_tickets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = support_tickets.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY tickets_insert ON gift.support_tickets FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = support_tickets.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY tickets_update ON gift.support_tickets FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = support_tickets.organization_id 
    AND user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = support_tickets.organization_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY tickets_delete ON gift.support_tickets FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM common.organization_members 
    WHERE organization_id = support_tickets.organization_id 
    AND user_id = auth.uid()
  )
); 