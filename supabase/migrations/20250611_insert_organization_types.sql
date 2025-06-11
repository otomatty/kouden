-- 20250611_insert_organization_types.sql

-- 初期組織種別データ挿入
insert into organization_types (name) values
  ('funeral_company'),
  ('gift_shop');

-- RLS設定: organization_types を有効化し、全ユーザーに select を許可
alter table organization_types enable row level security;
create policy "Allow select on organization_types" on organization_types
  for select using (true); 