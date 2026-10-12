-- 香典返しの期限のお知らせ（E6-5）を受け取るか。オーナーは常に受け取り、編集者は本人が選ぶ
ALTER TABLE kouden_members ADD COLUMN notify_reminders INTEGER NOT NULL DEFAULT 0;
