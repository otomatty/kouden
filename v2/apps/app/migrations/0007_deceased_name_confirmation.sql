-- 旧台帳名から仮設定した故人名の確認日時。legacy_kouden_id があり NULL の香典帳だけ確認を促す。
-- 既存の移行済み香典帳も未確認になり、新規作成の香典帳には確認を求めない。
ALTER TABLE koudens ADD COLUMN deceased_name_confirmed_at TEXT;
