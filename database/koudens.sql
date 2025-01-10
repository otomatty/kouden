-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS koudens CASCADE;

-- Create koudens table (香典帳テーブル)
CREATE TABLE IF NOT EXISTS koudens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- 香典帳のタイトル（例：「〇〇家 告別式」）
    title TEXT NOT NULL,
    -- 香典帳の説明（任意）
    description TEXT,
    -- 作成日時
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 更新日時
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    -- 作成者のユーザーID（authテーブルの参照）
    created_by UUID NOT NULL REFERENCES auth.users(id),
    -- 所有者のユーザーID（authテーブルの参照）
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    -- 共有ユーザーのID配列（authテーブルの参照）
    shared_user_ids UUID[] DEFAULT '{}'::UUID[] NOT NULL,
    -- 香典帳の状態（active/archived）
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_koudens_updated_at ON koudens;

-- Create trigger for updated_at
CREATE TRIGGER update_koudens_updated_at
    BEFORE UPDATE ON koudens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing indexes
DROP INDEX IF EXISTS idx_koudens_owner_id;
DROP INDEX IF EXISTS idx_koudens_created_by;

-- Create indexes
CREATE INDEX idx_koudens_owner_id ON koudens(owner_id);
CREATE INDEX idx_koudens_created_by ON koudens(created_by);

-- Enable Row Level Security
ALTER TABLE koudens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own koudens" ON koudens;
DROP POLICY IF EXISTS "Users can insert their own koudens" ON koudens;
DROP POLICY IF EXISTS "Users can update their own koudens" ON koudens;
DROP POLICY IF EXISTS "Users can delete their own koudens" ON koudens;

-- Create RLS policies
CREATE POLICY "Users can view their own koudens"
    ON koudens FOR SELECT
    USING (
        auth.uid()::uuid = owner_id
        OR auth.uid()::uuid = ANY(shared_user_ids)
    );

CREATE POLICY "Users can insert their own koudens"
    ON koudens FOR INSERT
    WITH CHECK (
        auth.uid()::uuid = owner_id
        AND auth.uid()::uuid = created_by
    );

CREATE POLICY "Users can update their own koudens"
    ON koudens FOR UPDATE
    USING (auth.uid()::uuid = owner_id)
    WITH CHECK (auth.uid()::uuid = owner_id);

CREATE POLICY "Users can delete their own koudens"
    ON koudens FOR DELETE
    USING (auth.uid()::uuid = owner_id); 