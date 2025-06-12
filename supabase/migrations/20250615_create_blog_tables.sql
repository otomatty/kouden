-- 20250615_create_blog_tables.sql

-- 公開ステータス用の型を定義
create type public.post_status as enum ('draft', 'published');

-- ブログ記事テーブル (posts)
create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references common.organizations (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text,
  slug text not null unique,
  status public.post_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- インデックス作成
create index if not exists idx_posts_organization_id on public.posts(organization_id);
create index if not exists idx_posts_author_id on public.posts(author_id);
create index if not exists idx_posts_slug on public.posts(slug);
create index if not exists idx_posts_status on public.posts(status);

-- RLS ポリシー設定
alter table public.posts enable row level security;

-- 公開済みの記事は誰でも読める
create policy "Allow public read access to published posts"
  on public.posts for select
  using (status = 'published');

-- 自分の組織の記事（下書き含む）は読める
create policy "Allow members to read their organization's posts"
  on public.posts for select
  using (
    exists (
      select 1 from common.organization_members
      where common.organization_members.organization_id = posts.organization_id
        and common.organization_members.user_id = auth.uid()
    )
  );

-- 自分の組織のメンバーは記事を作成できる
create policy "Allow members to create posts for their organization"
  on public.posts for insert
  with check (
    exists (
      select 1 from common.organization_members
      where common.organization_members.organization_id = posts.organization_id
        and common.organization_members.user_id = auth.uid()
    )
    and author_id = auth.uid() -- 作成者は自分自身である必要がある
  );

-- 自分の組織のメンバーは記事を更新できる
create policy "Allow members to update their organization's posts"
  on public.posts for update
  using (
    exists (
      select 1 from common.organization_members
      where common.organization_members.organization_id = posts.organization_id
        and common.organization_members.user_id = auth.uid()
    )
  );

-- 自分の組織のメンバーは記事を削除できる
create policy "Allow members to delete their organization's posts"
  on public.posts for delete
  using (
    exists (
      select 1 from common.organization_members
      where common.organization_members.organization_id = posts.organization_id
        and common.organization_members.user_id = auth.uid()
    )
  ); 