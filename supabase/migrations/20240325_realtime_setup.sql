-- リアルタイム更新のための設定
begin;

-- publicationが存在しない場合は作成
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    execute 'create publication supabase_realtime';
  end if;
end;
$$;

-- kouden_entriesテーブルをpublicationに追加
alter publication supabase_realtime add table public.kouden_entries;

-- RLSポリシーを更新して、リアルタイム更新を許可
drop policy if exists "Users can subscribe to their koudens entries" on public.kouden_entries;

create policy "Users can subscribe to their koudens entries"
  on public.kouden_entries
  for select
  using (
    exists (
      select 1 from koudens
      where koudens.id = kouden_entries.kouden_id
      and (
        koudens.owner_id = auth.uid()
        or auth.uid() = any(koudens.shared_user_ids)
      )
    )
  );

commit; 