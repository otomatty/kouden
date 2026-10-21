-- 既存のテーブルを削除（依存関係も含めて）
drop table if exists support_ticket_comments cascade;
drop table if exists support_tickets cascade;

-- タイムスタンプ更新用の関数を作成
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$ language plpgsql;

-- support_tickets テーブルを作成
create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  content text not null,
  status text not null check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null check (priority in ('low', 'normal', 'high', 'urgent')),
  user_id uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  resolved_at timestamp with time zone
);

-- ticket_messages テーブルを作成
create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  content text not null,
  is_admin_reply boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamp with time zone default now()
);

-- RLSポリシーを設定
alter table support_tickets enable row level security;
alter table ticket_messages enable row level security;

-- 管理者は全ての操作が可能
create policy "管理者は全ての操作が可能" on support_tickets
  for all
  to authenticated
  using (exists (
    select 1 from admin_users where user_id = auth.uid()
  ));

create policy "管理者は全ての操作が可能" on ticket_messages
  for all
  to authenticated
  using (exists (
    select 1 from admin_users where user_id = auth.uid()
  ));

-- ユーザーは自分のチケットのみ閲覧可能
create policy "ユーザーは自分のチケットのみ閲覧可能" on support_tickets
  for select
  to authenticated
  using (user_id = auth.uid());

-- ユーザーは自分のチケットのメッセージのみ閲覧可能
create policy "ユーザーは自分のチケットのメッセージのみ閲覧可能" on ticket_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from support_tickets
      where id = ticket_id
      and user_id = auth.uid()
    )
  );

-- ユーザーは自分のチケットにのみメッセージを追加可能
create policy "ユーザーは自分のチケットにのみメッセージを追加可能" on ticket_messages
  for insert
  to authenticated
  with check (
    exists (
      select 1 from support_tickets
      where id = ticket_id
      and user_id = auth.uid()
    )
    and not is_admin_reply
  );

-- 更新時のタイムスタンプを自動更新
create trigger set_timestamp
  before update on support_tickets
  for each row
  execute function update_updated_at(); 