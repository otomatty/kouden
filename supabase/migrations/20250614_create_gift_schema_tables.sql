-- Migration: Create gift schema and domain-specific tables

-- 1. Create gift schema
CREATE SCHEMA IF NOT EXISTS gift;

-- 2. loyalty_points table
CREATE TABLE IF NOT EXISTS gift.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at DATE,
  CONSTRAINT fk_loyalty_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_loyalty_customer FOREIGN KEY (customer_id)
    REFERENCES common.customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_loyalty_org ON gift.loyalty_points(organization_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON gift.loyalty_points(customer_id);

-- 3. tiers table
CREATE TABLE IF NOT EXISTS gift.tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  threshold INTEGER NOT NULL,
  CONSTRAINT fk_tiers_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tiers_org ON gift.tiers(organization_id);

-- 4. marketing_campaigns table
CREATE TABLE IF NOT EXISTS gift.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50),
  CONSTRAINT fk_campaigns_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON gift.marketing_campaigns(organization_id);

-- 5. marketing_templates table
CREATE TABLE IF NOT EXISTS gift.marketing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  type VARCHAR(10),
  content TEXT,
  CONSTRAINT fk_templates_campaign FOREIGN KEY (campaign_id)
    REFERENCES gift.marketing_campaigns(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_templates_campaign ON gift.marketing_templates(campaign_id);

-- 6. products table
CREATE TABLE IF NOT EXISTS gift.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_products_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_products_org ON gift.products(organization_id);

-- 7. orders table
CREATE TABLE IF NOT EXISTS gift.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_orders_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
    REFERENCES common.customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_orders_org ON gift.orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON gift.orders(customer_id);

-- 8. order_items table
CREATE TABLE IF NOT EXISTS gift.order_items (
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (order_id, product_id),
  CONSTRAINT fk_items_order FOREIGN KEY (order_id)
    REFERENCES gift.orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id)
    REFERENCES gift.products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_items_order ON gift.order_items(order_id);

-- 9. shipping table
CREATE TABLE IF NOT EXISTS gift.shipping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  order_id UUID NOT NULL,
  carrier VARCHAR(100),
  tracking_no VARCHAR(100) UNIQUE,
  status VARCHAR(50),
  delivered_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_shipping_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_shipping_order FOREIGN KEY (order_id)
    REFERENCES gift.orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_shipping_org ON gift.shipping(organization_id);
CREATE INDEX IF NOT EXISTS idx_shipping_order ON gift.shipping(order_id);

-- 10. promotions table
CREATE TABLE IF NOT EXISTS gift.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(50),
  discount_value NUMERIC(10,2),
  expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_promotions_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_promotions_org ON gift.promotions(organization_id);

-- 11. support_tickets table
CREATE TABLE IF NOT EXISTS gift.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_tickets_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tickets_customer FOREIGN KEY (customer_id)
    REFERENCES common.customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tickets_org ON gift.support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON gift.support_tickets(customer_id);

-- 12. Enable RLS and create policies for multi-tenancy on gift tables

-- gift.loyalty_points
ALTER TABLE gift.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY loyalty_select ON gift.loyalty_points FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY loyalty_insert ON gift.loyalty_points FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY loyalty_update ON gift.loyalty_points FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY loyalty_delete ON gift.loyalty_points FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- gift.tiers
ALTER TABLE gift.tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tiers_select ON gift.tiers FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY tiers_insert ON gift.tiers FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY tiers_update ON gift.tiers FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY tiers_delete ON gift.tiers FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- gift.marketing_campaigns
ALTER TABLE gift.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaigns_select ON gift.marketing_campaigns FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY campaigns_insert ON gift.marketing_campaigns FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY campaigns_update ON gift.marketing_campaigns FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY campaigns_delete ON gift.marketing_campaigns FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- gift.products
ALTER TABLE gift.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_select ON gift.products FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY products_insert ON gift.products FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY products_update ON gift.products FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY products_delete ON gift.products FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- gift.orders
ALTER TABLE gift.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_select ON gift.orders FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY orders_insert ON gift.orders FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY orders_update ON gift.orders FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY orders_delete ON gift.orders FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- gift.shipping
ALTER TABLE gift.shipping ENABLE ROW LEVEL SECURITY;
CREATE POLICY shipping_select ON gift.shipping FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY shipping_insert ON gift.shipping FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY shipping_update ON gift.shipping FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY shipping_delete ON gift.shipping FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- gift.promotions
ALTER TABLE gift.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY promotions_select ON gift.promotions FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY promotions_insert ON gift.promotions FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY promotions_update ON gift.promotions FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY promotions_delete ON gift.promotions FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- gift.support_tickets
ALTER TABLE gift.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tickets_select ON gift.support_tickets FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY tickets_insert ON gift.support_tickets FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY tickets_update ON gift.support_tickets FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY tickets_delete ON gift.support_tickets FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- 13. Additional indexes for performance on gift tables
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON gift.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON gift.marketing_campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON gift.products(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON gift.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON gift.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_shipping_status ON gift.shipping(status);
CREATE INDEX IF NOT EXISTS idx_promotions_expires_at ON gift.promotions(expires_at);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON gift.support_tickets(status); 