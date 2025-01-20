-- Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_target_type CHECK (target_type IN (
        'user', 'kouden', 'announcement', 'support_ticket', 'admin'
    ))
);

-- Enable RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- View policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON admin_audit_logs
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- Insert policy: System can insert audit logs for admin actions
CREATE POLICY "System can insert audit logs"
    ON admin_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin(auth.uid()));

-- No update policy needed as audit logs should not be modified
-- No delete policy needed as audit logs should not be deleted

-- Function to create audit log
CREATE OR REPLACE FUNCTION create_admin_audit_log(
    p_action VARCHAR,
    p_target_type VARCHAR,
    p_target_id UUID,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_admin_id UUID;
    v_log_id UUID;
BEGIN
    -- Get the current user's ID
    v_admin_id := auth.uid();
    
    -- Check if the user is an admin
    IF NOT is_admin(v_admin_id) THEN
        RAISE EXCEPTION 'User is not an admin';
    END IF;

    -- Insert the audit log
    INSERT INTO admin_audit_logs (
        admin_id,
        action,
        target_type,
        target_id,
        details,
        ip_address
    ) VALUES (
        v_admin_id,
        p_action,
        p_target_type,
        p_target_id,
        p_details,
        p_ip_address
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 