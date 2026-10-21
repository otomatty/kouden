-- System Announcements Table
CREATE TABLE IF NOT EXISTS system_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT valid_category CHECK (category IN ('system', 'feature', 'important', 'event', 'other'))
);

-- Enable RLS
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

-- Policies
-- View policy: All authenticated users can view published announcements
CREATE POLICY "Users can view published announcements"
    ON system_announcements
    FOR SELECT
    TO authenticated
    USING (
        status = 'published' 
        AND published_at <= NOW()
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Admin policies using the is_admin function from admin_users.sql
CREATE POLICY "Admins can view all announcements"
    ON system_announcements
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert announcements"
    ON system_announcements
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update announcements"
    ON system_announcements
    FOR UPDATE
    TO authenticated
    USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete announcements"
    ON system_announcements
    FOR DELETE
    TO authenticated
    USING (is_admin(auth.uid()));

-- Triggers
CREATE OR REPLACE FUNCTION update_system_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_announcements_updated_at
    BEFORE UPDATE ON system_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_system_announcements_updated_at(); 