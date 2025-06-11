-- Migration: Create funeral schema and domain-specific tables

-- 1. Create funeral schema
CREATE SCHEMA IF NOT EXISTS funeral;

-- 2. cases table
CREATE TABLE IF NOT EXISTS funeral.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  deceased_name VARCHAR(255) NOT NULL,
  venue VARCHAR(255),
  start_datetime TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_cases_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cases_customer FOREIGN KEY (customer_id)
    REFERENCES common.customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cases_org ON funeral.cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_cases_customer ON funeral.cases(customer_id);

-- 3. attendees table
CREATE TABLE IF NOT EXISTS funeral.attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  case_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  relation VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_attendees_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attendees_case FOREIGN KEY (case_id)
    REFERENCES funeral.cases(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attendees_org ON funeral.attendees(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendees_case ON funeral.attendees(case_id);

-- 4. donations table
CREATE TABLE IF NOT EXISTS funeral.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  case_id UUID NOT NULL,
  donor_name VARCHAR(255),
  amount NUMERIC(10,2) NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_donations_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_donations_case FOREIGN KEY (case_id)
    REFERENCES funeral.cases(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_donations_org ON funeral.donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_case ON funeral.donations(case_id);

-- 5. contacts table
CREATE TABLE IF NOT EXISTS funeral.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  type VARCHAR(10),
  template TEXT,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_contacts_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_contacts_customer FOREIGN KEY (customer_id)
    REFERENCES common.customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON funeral.contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_customer ON funeral.contacts(customer_id);

-- 6. quotes table
CREATE TABLE IF NOT EXISTS funeral.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  case_id UUID NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  pdf_url TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_quotes_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_quotes_case FOREIGN KEY (case_id)
    REFERENCES funeral.cases(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON funeral.quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_case ON funeral.quotes(case_id);

-- 7. invoices table
CREATE TABLE IF NOT EXISTS funeral.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  case_id UUID NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_invoices_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_case FOREIGN KEY (case_id)
    REFERENCES funeral.cases(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON funeral.invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_case ON funeral.invoices(case_id);

-- 8. material_orders table
CREATE TABLE IF NOT EXISTS funeral.material_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  case_id UUID NOT NULL,
  item VARCHAR(255),
  quantity INTEGER,
  order_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_material_orders_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_material_orders_case FOREIGN KEY (case_id)
    REFERENCES funeral.cases(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_material_orders_org ON funeral.material_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_material_orders_case ON funeral.material_orders(case_id);

-- 9. tasks table
CREATE TABLE IF NOT EXISTS funeral.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  case_id UUID NOT NULL,
  assigned_to UUID NOT NULL,
  due_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_tasks_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tasks_case FOREIGN KEY (case_id)
    REFERENCES funeral.cases(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tasks_user FOREIGN KEY (assigned_to)
    REFERENCES auth.users(id)
    ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON funeral.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_case ON funeral.tasks(case_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON funeral.tasks(assigned_to);

-- 10. reservations table
CREATE TABLE IF NOT EXISTS funeral.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_reservations_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id)
    REFERENCES common.customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reservations_org ON funeral.reservations(organization_id);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON funeral.reservations(customer_id);

-- 11. Enable RLS and create policies for multi-tenancy

-- funeral.cases
ALTER TABLE funeral.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY cases_select ON funeral.cases FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY cases_insert ON funeral.cases FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY cases_update ON funeral.cases FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY cases_delete ON funeral.cases FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- funeral.attendees
ALTER TABLE funeral.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendees_select ON funeral.attendees FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY attendees_insert ON funeral.attendees FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY attendees_update ON funeral.attendees FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY attendees_delete ON funeral.attendees FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- funeral.donations
ALTER TABLE funeral.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY donations_select ON funeral.donations FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY donations_insert ON funeral.donations FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY donations_update ON funeral.donations FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY donations_delete ON funeral.donations FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- funeral.contacts
ALTER TABLE funeral.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_select ON funeral.contacts FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY contacts_insert ON funeral.contacts FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY contacts_update ON funeral.contacts FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY contacts_delete ON funeral.contacts FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- funeral.quotes
ALTER TABLE funeral.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY quotes_select ON funeral.quotes FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY quotes_insert ON funeral.quotes FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY quotes_update ON funeral.quotes FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY quotes_delete ON funeral.quotes FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- funeral.invoices
ALTER TABLE funeral.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_select ON funeral.invoices FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY invoices_insert ON funeral.invoices FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY invoices_update ON funeral.invoices FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY invoices_delete ON funeral.invoices FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- funeral.material_orders
ALTER TABLE funeral.material_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY material_orders_select ON funeral.material_orders FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY material_orders_insert ON funeral.material_orders FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY material_orders_update ON funeral.material_orders FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY material_orders_delete ON funeral.material_orders FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- funeral.tasks
ALTER TABLE funeral.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_select ON funeral.tasks FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY tasks_insert ON funeral.tasks FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY tasks_update ON funeral.tasks FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY tasks_delete ON funeral.tasks FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- funeral.reservations
ALTER TABLE funeral.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY reservations_select ON funeral.reservations FOR SELECT USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY reservations_insert ON funeral.reservations FOR INSERT WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY reservations_update ON funeral.reservations FOR UPDATE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);
CREATE POLICY reservations_delete ON funeral.reservations FOR DELETE USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- 12. Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_status ON funeral.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_start_datetime ON funeral.cases(start_datetime);
CREATE INDEX IF NOT EXISTS idx_attendees_status ON funeral.attendees(status);
CREATE INDEX IF NOT EXISTS idx_donations_received_at ON funeral.donations(received_at);
CREATE INDEX IF NOT EXISTS idx_contacts_last_sent_at ON funeral.contacts(last_sent_at);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON funeral.quotes(status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON funeral.invoices(status);
CREATE INDEX IF NOT EXISTS idx_material_orders_order_date ON funeral.material_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON funeral.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON funeral.reservations(date); 