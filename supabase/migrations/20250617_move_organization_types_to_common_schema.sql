-- 20250617_move_organization_types_to_common_schema.sql

-- 1. commonスキーマが存在しない場合は作成
CREATE SCHEMA IF NOT EXISTS common;

-- 2. commonスキーマにorganization_typesテーブルを作成
CREATE TABLE IF NOT EXISTS common.organization_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. publicスキーマからデータを移行（存在する場合）
INSERT INTO common.organization_types (id, name, created_at, updated_at)
SELECT id, name, created_at, updated_at
FROM public.organization_types
ON CONFLICT (id) DO NOTHING;

-- 4. commonスキーマにorganizationsテーブルを作成
CREATE TABLE IF NOT EXISTS common.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type_id uuid not null references common.organization_types (id) on delete restrict,
  status text default 'pending',
  requester_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. publicスキーマからorganizationsデータを移行（存在する場合）
INSERT INTO common.organizations (id, name, type_id, status, requester_id, created_at, updated_at)
SELECT id, name, type_id, 
       COALESCE(status, 'pending') as status,
       requester_id,
       created_at, updated_at
FROM public.organizations
ON CONFLICT (id) DO NOTHING;

-- 6. commonスキーマにorganization_membersテーブルを作成
CREATE TABLE IF NOT EXISTS common.organization_members (
  organization_id uuid not null references common.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- 7. publicスキーマからorganization_membersデータを移行（存在する場合）
INSERT INTO common.organization_members (organization_id, user_id, role, created_at)
SELECT organization_id, user_id, role, created_at
FROM public.organization_members
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 8. インデックス作成
CREATE INDEX IF NOT EXISTS idx_common_organizations_type_id ON common.organizations(type_id);
CREATE INDEX IF NOT EXISTS idx_common_organization_members_user_id ON common.organization_members(user_id);

-- 9. RLS ポリシー設定

-- common.organization_types: 全ユーザーが参照可能
ALTER TABLE common.organization_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select on organization_types" ON common.organization_types
  FOR SELECT USING (true);

-- common.organizations: 自分が所属する組織のみ参照可能
ALTER TABLE common.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select own organizations" ON common.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM common.organization_members
      WHERE common.organization_members.organization_id = common.organizations.id
        AND common.organization_members.user_id = auth.uid()
    )
  );
CREATE POLICY "Insert organizations" ON common.organizations
  FOR INSERT WITH CHECK (
    requester_id = auth.uid()
  );

-- common.organization_members: 自分のメンバーシップのみ参照可能
ALTER TABLE common.organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Select own memberships" ON common.organization_members
  FOR SELECT USING (
    user_id = auth.uid()
  );
CREATE POLICY "Insert own membership" ON common.organization_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );
CREATE POLICY "Update own membership" ON common.organization_members
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );
CREATE POLICY "Delete own membership" ON common.organization_members
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- 10. 初期データ挿入（存在しない場合のみ）
INSERT INTO common.organization_types (name) VALUES
  ('funeral_company'),
  ('gift_shop')
ON CONFLICT (name) DO NOTHING;

-- 11. publicスキーマのテーブルを削除（データ移行後）
-- 注意: 外部キー制約がある場合は、依存関係を考慮して削除順序を調整
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.organization_types CASCADE; 