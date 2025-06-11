-- 20250610_create_organizations_and_members.sql

-- UUID生成用拡張
create extension if not exists "uuid-ossp";

-- 企業種別テーブル (organization_types)
create table if not exists organization_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 組織テーブル (organizations)
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type_id uuid not null references organization_types (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 中間テーブル: ユーザー(auth.users)と組織の多対多
create table if not exists organization_members (
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- インデックス作成
create index if not exists idx_organizations_type_id on organizations(type_id);
create index if not exists idx_organization_members_user_id on organization_members(user_id);

-- RLS ポリシー設定
alter table organizations enable row level security;
create policy "Select own organizations" on organizations
  for select using (
    exists (
      select 1 from organization_members
      where organization_members.organization_id = organizations.id
        and organization_members.user_id = auth.uid()
    )
  );
create policy "Insert organizations" on organizations
  for insert with check (
    true
  );

alter table organization_members enable row level security;
create policy "Select own memberships" on organization_members
  for select using (
    user_id = auth.uid()
  );
create policy "Insert own membership" on organization_members
  for insert with check (
    user_id = auth.uid()
  );
create policy "Update own membership" on organization_members
  for update using (
    user_id = auth.uid()
  ) with check (
    user_id = auth.uid()
  );
create policy "Delete own membership" on organization_members
  for delete using (
    user_id = auth.uid()
  );
-- End of migration 