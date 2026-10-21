-- リアルタイムトークンを取得する関数
CREATE OR REPLACE FUNCTION get_realtime_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 認証済みユーザーのみ実行可能
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- リアルタイムトークンを生成して返す
    RETURN gen_random_uuid()::TEXT;
END;
$$; 