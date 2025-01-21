-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_settings CASCADE;

-- Create user_settings table (ユーザー設定テーブル)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- UI/UX設定
    guide_mode BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'

    -- システム列
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

-- Create trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;

-- Create RLS policies
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Function to handle new user authentication
CREATE OR REPLACE FUNCTION handle_new_user_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 既存の設定がない場合のみ作成
    IF NOT EXISTS (SELECT 1 FROM public.user_settings WHERE id = NEW.id) THEN
        INSERT INTO public.user_settings (id)
        VALUES (NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger after auth.users authentication
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
    AFTER INSERT OR UPDATE OF last_sign_in_at
    ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_settings(); 