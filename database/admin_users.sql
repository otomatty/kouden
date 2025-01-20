-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_admin_user UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM admin_users 
        WHERE user_id = user_uid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies
-- View policy: Any authenticated user can view if they are an admin
CREATE POLICY "Admins can view admin_users"
    ON admin_users
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- Insert policy: Only super admins can add new admins
CREATE POLICY "Super admins can insert admin_users"
    ON admin_users
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Update policy: Only super admins can update admin roles
CREATE POLICY "Super admins can update admin_users"
    ON admin_users
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Delete policy: Only super admins can delete admins
CREATE POLICY "Super admins can delete admin_users"
    ON admin_users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Triggers
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at(); 