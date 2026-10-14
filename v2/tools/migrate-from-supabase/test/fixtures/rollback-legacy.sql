-- Cut-down PostgreSQL fixture from the legacy schema, inspected 2026-10-14.
-- Includes generated columns, relevant constraints and business triggers; not a production migration.

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.koudens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid NOT NULL,
  owner_id uuid NOT NULL,
  status text DEFAULT 'active'::text NOT NULL,
  plan_id uuid NOT NULL
);

CREATE TABLE public.kouden_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  kouden_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  permissions text[] NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid NOT NULL
);

CREATE TABLE public.kouden_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  kouden_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  added_by uuid NOT NULL,
  invitation_id uuid
);

CREATE TABLE public.kouden_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  kouden_id uuid NOT NULL,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  expected_count integer,
  amount_paid integer NOT NULL,
  stripe_session_id text,
  purchased_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  kouden_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid NOT NULL,
  is_enabled boolean DEFAULT true NOT NULL
);

CREATE TABLE public.kouden_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  kouden_id uuid NOT NULL,
  name text,
  organization text,
  position text,
  amount integer NOT NULL,
  postal_code text,
  address text,
  phone_number text,
  relationship_id uuid,
  attendance_type text NOT NULL,
  has_offering boolean DEFAULT false NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid NOT NULL,
  version integer DEFAULT 1,
  last_modified_at timestamp with time zone DEFAULT now(),
  last_modified_by uuid,
  is_duplicate boolean DEFAULT false NOT NULL
);

CREATE TABLE public.offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  kouden_id uuid NOT NULL,
  type text NOT NULL,
  description text,
  quantity integer DEFAULT 1 NOT NULL,
  price integer DEFAULT 0 NOT NULL,
  provider_name text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid NOT NULL
);

CREATE TABLE public.offering_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  offering_id uuid,
  kouden_entry_id uuid,
  allocated_amount bigint NOT NULL,
  allocation_ratio numeric NOT NULL,
  is_primary_contributor boolean DEFAULT false,
  contribution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

CREATE TABLE public.offering_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  offering_id uuid NOT NULL,
  kouden_entry_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid NOT NULL
);

CREATE TABLE public.offering_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  offering_id uuid NOT NULL,
  storage_key text NOT NULL,
  caption text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid NOT NULL
);

CREATE TABLE public.telegrams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  kouden_id uuid NOT NULL,
  kouden_entry_id uuid,
  sender_name text NOT NULL,
  sender_organization text,
  sender_position text,
  message text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid NOT NULL
);

CREATE TABLE public.return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid NOT NULL,
  kouden_id uuid NOT NULL,
  price integer NOT NULL,
  category text DEFAULT 'OTHER'::text,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  recommended_amount_min integer DEFAULT 0,
  recommended_amount_max integer
);

CREATE TABLE public.return_entry_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  kouden_entry_id uuid NOT NULL,
  total_amount bigint DEFAULT 0 NOT NULL,
  return_status text DEFAULT 'PENDING'::text NOT NULL,
  funeral_gift_amount bigint DEFAULT 0 NOT NULL,
  additional_return_amount bigint GENERATED ALWAYS AS (GREATEST(0::bigint, total_amount - funeral_gift_amount)) STORED,
  return_method text,
  return_items jsonb,
  arrangement_date date,
  remarks text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  shipping_postal_code text,
  shipping_address text,
  shipping_phone_number text,
  return_items_cost bigint DEFAULT 0 NOT NULL,
  profit_loss bigint GENERATED ALWAYS AS (total_amount - COALESCE(return_items_cost,0::bigint)) STORED
);

CREATE TABLE public.return_record_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  return_record_id uuid NOT NULL,
  return_item_master_id uuid NOT NULL,
  price integer NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid NOT NULL
);

ALTER TABLE kouden_entries ADD FOREIGN KEY (relationship_id) REFERENCES relationships(id);
ALTER TABLE kouden_members ADD UNIQUE(kouden_id,user_id);
CREATE UNIQUE INDEX relationships_kouden_id_name_enabled_key ON relationships(kouden_id,name) WHERE is_enabled;
ALTER TABLE offering_entries ADD FOREIGN KEY (kouden_entry_id) REFERENCES kouden_entries(id);
ALTER TABLE offering_entries ADD FOREIGN KEY (offering_id) REFERENCES offerings(id);
ALTER TABLE return_entry_records ADD FOREIGN KEY (kouden_entry_id) REFERENCES kouden_entries(id);
ALTER TABLE return_record_items ADD FOREIGN KEY (return_record_id) REFERENCES return_entry_records(id);
ALTER TABLE return_record_items ADD FOREIGN KEY (return_item_master_id) REFERENCES return_items(id);
CREATE FUNCTION public.test_touch() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN NEW.updated_at := now(); RETURN NEW; END $f$;
CREATE TRIGGER touch BEFORE UPDATE ON kouden_entries FOR EACH ROW EXECUTE FUNCTION public.test_touch();
CREATE FUNCTION public.test_return_total() RETURNS trigger LANGUAGE plpgsql AS $f$
BEGIN
  NEW.total_amount := (SELECT amount FROM public.kouden_entries WHERE id=NEW.kouden_entry_id)
    + COALESCE((SELECT sum(o.price * o.quantity) FROM public.offerings o JOIN public.offering_entries oe ON oe.offering_id=o.id WHERE oe.kouden_entry_id=NEW.kouden_entry_id),0);
  RETURN NEW;
END $f$;
CREATE TRIGGER return_total BEFORE INSERT OR UPDATE ON return_entry_records FOR EACH ROW EXECUTE FUNCTION public.test_return_total();
