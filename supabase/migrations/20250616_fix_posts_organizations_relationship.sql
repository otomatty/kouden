-- 20250616_fix_posts_organizations_relationship.sql
-- posts テーブルと organizations テーブルの関係を修正

-- 既存の外部キー制約を削除（存在する場合）
alter table if exists public.posts 
drop constraint if exists posts_organization_id_fkey;

-- 正しいスキーマを指定して外部キー制約を追加
alter table public.posts 
add constraint posts_organization_id_fkey 
foreign key (organization_id) references common.organizations(id) on delete cascade;

-- excerpt カラムを追加（概要文用）
alter table public.posts 
add column if not exists excerpt text;

-- category カラムを追加（カテゴリ用）
alter table public.posts 
add column if not exists category text;

-- インデックスを再作成
drop index if exists idx_posts_organization_id;
create index idx_posts_organization_id on public.posts(organization_id);

-- カテゴリ用のインデックスを追加
create index if not exists idx_posts_category on public.posts(category);

-- published_at での並び替えのためのインデックス
create index if not exists idx_posts_published_at on public.posts(published_at desc) where status = 'published'; 