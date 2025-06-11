-- 20250612_add_status_and_requester_to_organizations.sql
 
-- 組織テーブルにステータスとリクエスターを追加
alter table organizations
  add column status text not null default 'pending' check(status in ('pending','active','rejected')),
  add column requested_by uuid not null references auth.users(id) on delete cascade; 