CREATE TABLE IF NOT EXISTS user_announcement_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    announcement_id UUID NOT NULL REFERENCES system_announcements(id),
    is_read BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, announcement_id)
);

-- RLSの設定
ALTER TABLE user_announcement_reads ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の既読状態のみ参照可能
CREATE POLICY "Users can view own reads"
    ON user_announcement_reads
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ユーザーは自分の既読状態のみ作成可能
CREATE POLICY "Users can insert own reads"
    ON user_announcement_reads
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の既読状態のみ更新可能
CREATE POLICY "Users can update own reads"
    ON user_announcement_reads
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- お知らせが公開された時に全ユーザーの既読状態を追加/削除するトリガー関数
CREATE OR REPLACE FUNCTION manage_announcement_reads()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    -- 新規作成または更新で公開状態になった場合
    IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR
       (TG_OP = 'UPDATE' AND NEW.status = 'published' AND OLD.status != 'published') THEN
        -- 全ユーザーに対して未読状態を作成
        INSERT INTO user_announcement_reads (user_id, announcement_id, is_read)
        SELECT id, NEW.id, FALSE
        FROM auth.users
        ON CONFLICT (user_id, announcement_id) DO NOTHING;
    
    -- 更新で非公開状態になった場合
    ELSIF (TG_OP = 'UPDATE' AND NEW.status != 'published' AND OLD.status = 'published') OR
          (TG_OP = 'DELETE' AND OLD.status = 'published') THEN
        -- 既読状態を削除
        DELETE FROM user_announcement_reads
        WHERE announcement_id = COALESCE(NEW.id, OLD.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの設定
CREATE TRIGGER manage_announcement_reads_trigger
AFTER INSERT OR UPDATE OR DELETE ON system_announcements
FOR EACH ROW
EXECUTE FUNCTION manage_announcement_reads();

-- 新規ユーザー登録時に公開中のお知らせの既読状態を作成するトリガー関数
CREATE OR REPLACE FUNCTION create_announcement_reads_for_new_user()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    -- 新規ユーザーに対して公開中のお知らせの未読状態を作成
    INSERT INTO user_announcement_reads (user_id, announcement_id, is_read)
    SELECT NEW.id, id, FALSE
    FROM system_announcements
    WHERE status = 'published'
    ON CONFLICT (user_id, announcement_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 新規ユーザー用トリガーの設定
CREATE TRIGGER create_announcement_reads_for_new_user_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_announcement_reads_for_new_user();

-- RLSポリシーを追加
ALTER TABLE user_announcement_reads ENABLE ROW LEVEL SECURITY;

-- トリガー関数からの操作を許可するポリシー
CREATE POLICY "Allow trigger function to manage reads"
    ON user_announcement_reads
    FOR ALL
    TO postgres
    USING (true)
    WITH CHECK (true);