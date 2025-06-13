-- funeral.customer_details table for funeral-specific customer information
CREATE TABLE IF NOT EXISTS funeral.customer_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE,
  organization_id UUID NOT NULL,
  address TEXT,
  religion VARCHAR(100),
  allergy TEXT,
  registration_date DATE DEFAULT CURRENT_DATE,
  last_contact_date DATE,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'アクティブ',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Foreign key constraints
  CONSTRAINT fk_customer_details_customer FOREIGN KEY (customer_id)
    REFERENCES common.customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_customer_details_org FOREIGN KEY (organization_id)
    REFERENCES common.organizations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    
  -- Check constraints for status
  CONSTRAINT chk_customer_status CHECK (status IN ('アクティブ', '案件進行中', 'フォロー中', '完了'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_details_customer_id ON funeral.customer_details(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_details_org ON funeral.customer_details(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_details_status ON funeral.customer_details(status);
CREATE INDEX IF NOT EXISTS idx_customer_details_registration_date ON funeral.customer_details(registration_date);

-- Enable RLS and create policies for multi-tenancy
ALTER TABLE funeral.customer_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_details_select ON funeral.customer_details FOR SELECT 
  USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

CREATE POLICY customer_details_insert ON funeral.customer_details FOR INSERT 
  WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

CREATE POLICY customer_details_update ON funeral.customer_details FOR UPDATE 
  USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid) 
  WITH CHECK (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

CREATE POLICY customer_details_delete ON funeral.customer_details FOR DELETE 
  USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- Create function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
CREATE TRIGGER trigger_update_customer_details_updated_at
  BEFORE UPDATE ON funeral.customer_details
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_details_updated_at(); 