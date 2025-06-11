-- 2. customers table
CREATE TABLE IF NOT EXISTS common.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_customers_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. inventory table
CREATE TABLE IF NOT EXISTS common.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  item VARCHAR(255) NOT NULL,
  stock_level INTEGER NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_inventory_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. roles table
CREATE TABLE IF NOT EXISTS common.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL
);

-- 6. permissions table
CREATE TABLE IF NOT EXISTS common.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL
);

-- 7. role_permissions join table
CREATE TABLE IF NOT EXISTS common.role_permissions (
  role_id UUID NOT NULL,
  permission_id UUID NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id)
    REFERENCES common.roles(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id)
    REFERENCES common.permissions(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- 8. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON common.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_org ON common.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item ON common.inventory(item);
CREATE INDEX IF NOT EXISTS idx_inventory_org ON common.inventory(organization_id);

-- 9. Enable RLS and create policies for multi-tenancy on common tables

-- common.customers
ALTER TABLE common.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_select ON common.customers FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY customers_insert ON common.customers FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY customers_update ON common.customers FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY customers_delete ON common.customers FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- common.inventory
ALTER TABLE common.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_select ON common.inventory FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY inventory_insert ON common.inventory FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY inventory_update ON common.inventory FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY inventory_delete ON common.inventory FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- 10. Additional indexes for performance on date fields
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON common.customers(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON common.inventory(updated_at); 