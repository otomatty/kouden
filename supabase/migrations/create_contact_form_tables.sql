-- Enable pgcrypto extension for UUID generation
create extension if not exists "pgcrypto";

-- Table: contact_requests
create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  category text not null check (category in ('support','account','bug','feature','business','other')),
  name text,
  email text not null,
  subject text,
  message text not null,
  company_name text,
  company_size text,
  status text not null default 'new' check (status in ('new','in_progress','closed')),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable row level security for contact_requests
alter table public.contact_requests enable row level security;

-- Policies for contact_requests
create policy "Allow public to insert contact requests" on public.contact_requests
  for insert
  to public
  with check (true);

create policy "Allow authenticated to select contact requests" on public.contact_requests
  for select
  to authenticated
  using (true);

-- Indexes for contact_requests
create index idx_contact_requests_category on public.contact_requests(category);
create index idx_contact_requests_status on public.contact_requests(status);
create index idx_contact_requests_email on public.contact_requests(email);
create index idx_contact_requests_created_at on public.contact_requests(created_at);
create index idx_contact_requests_user_id on public.contact_requests(user_id);

-- Table: contact_request_attachments
create table public.contact_request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.contact_requests(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

-- Enable row level security for attachments
alter table public.contact_request_attachments enable row level security;

-- Policies for contact_request_attachments
create policy "Allow public to insert attachments" on public.contact_request_attachments
  for insert
  to public
  with check (true);

create policy "Allow authenticated to select attachments" on public.contact_request_attachments
  for select
  to authenticated
  using (true);

-- Index for attachments
create index idx_contact_request_attachments_request_id on public.contact_request_attachments(request_id);

-- Table: contact_responses
create table public.contact_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.contact_requests(id) on delete cascade,
  responder_id uuid references auth.users(id),
  response_message text not null,
  created_at timestamptz not null default now()
);

-- Enable row level security for responses
alter table public.contact_responses enable row level security;

-- Policies for contact_responses
create policy "Allow authenticated to insert responses" on public.contact_responses
  for insert
  to authenticated
  with check (true);

create policy "Allow authenticated to select responses" on public.contact_responses
  for select
  to authenticated
  using (true);

-- Index for responses
create index idx_contact_responses_request_id on public.contact_responses(request_id); 