-- セキュリティ強化用テーブル群

-- 1. admin_users テーブルに2FA関連カラムを追加
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;

-- 2. ログイン試行制限テーブル
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_ip UNIQUE (user_id, ip_address)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until ON login_attempts(locked_until);

-- 3. セキュリティログテーブル
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    details JSONB,
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, error, critical
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);

-- 4. IP制限テーブル
CREATE TABLE IF NOT EXISTS ip_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL UNIQUE,
    restriction_type VARCHAR(20) NOT NULL, -- 'admin_allow', 'global_block', 'suspicious'
    reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ip_restrictions_ip_address ON ip_restrictions(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_restrictions_type ON ip_restrictions(restriction_type);
CREATE INDEX IF NOT EXISTS idx_ip_restrictions_expires_at ON ip_restrictions(expires_at);

-- 5. ファイルアップロード制限テーブル
CREATE TABLE IF NOT EXISTS file_upload_restrictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_extension VARCHAR(10) NOT NULL UNIQUE,
    is_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    max_file_size INTEGER, -- バイト単位
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 許可されるファイル拡張子の初期データ
INSERT INTO file_upload_restrictions (file_extension, is_allowed, max_file_size, description) VALUES
('.jpg', TRUE, 5242880, 'JPEG画像ファイル（最大5MB）'),
('.jpeg', TRUE, 5242880, 'JPEG画像ファイル（最大5MB）'),
('.png', TRUE, 5242880, 'PNG画像ファイル（最大5MB）'),
('.pdf', TRUE, 10485760, 'PDFファイル（最大10MB）'),
('.csv', TRUE, 1048576, 'CSVファイル（最大1MB）'),
('.txt', TRUE, 1048576, 'テキストファイル（最大1MB）')
ON CONFLICT (file_extension) DO NOTHING;

-- 危険な拡張子を明示的にブロック
INSERT INTO file_upload_restrictions (file_extension, is_allowed, description) VALUES
('.exe', FALSE, '実行ファイル（禁止）'),
('.bat', FALSE, 'バッチファイル（禁止）'),
('.sh', FALSE, 'シェルスクリプト（禁止）'),
('.js', FALSE, 'JavaScriptファイル（禁止）'),
('.php', FALSE, 'PHPファイル（禁止）'),
('.asp', FALSE, 'ASPファイル（禁止）'),
('.jsp', FALSE, 'JSPファイル（禁止）')
ON CONFLICT (file_extension) DO NOTHING;

-- 6. RLSポリシー設定

-- login_attempts テーブル
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能
CREATE POLICY "Admins can view login attempts"
    ON login_attempts
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- システムが挿入・更新可能
CREATE POLICY "System can manage login attempts"
    ON login_attempts
    FOR ALL
    TO authenticated
    USING (TRUE);

-- security_logs テーブル
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能
CREATE POLICY "Admins can view security logs"
    ON security_logs
    FOR SELECT
    TO authenticated
    USING (is_admin(auth.uid()));

-- システムが挿入可能
CREATE POLICY "System can insert security logs"
    ON security_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- ip_restrictions テーブル
ALTER TABLE ip_restrictions ENABLE ROW LEVEL SECURITY;

-- スーパー管理者のみ管理可能
CREATE POLICY "Super admins can manage ip restrictions"
    ON ip_restrictions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM admin_users 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- file_upload_restrictions テーブル
ALTER TABLE file_upload_restrictions ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが閲覧可能
CREATE POLICY "Anyone can view file upload restrictions"
    ON file_upload_restrictions
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- スーパー管理者のみ更新可能
CREATE POLICY "Super admins can update file upload restrictions"
    ON file_upload_restrictions
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

-- 7. セキュリティ関数

-- セキュリティログ記録関数
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR(50),
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_path TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO security_logs (
        event_type, user_id, ip_address, user_agent, 
        request_path, details, severity
    ) VALUES (
        p_event_type, p_user_id, p_ip_address, p_user_agent,
        p_request_path, p_details, p_severity
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 怪しいアクティビティを検出する関数
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
    p_user_id UUID,
    p_ip_address INET
)
RETURNS BOOLEAN AS $$
DECLARE
    recent_failed_attempts INTEGER;
    different_ip_count INTEGER;
BEGIN
    -- 過去1時間の失敗試行回数をチェック
    SELECT COUNT(*) INTO recent_failed_attempts
    FROM login_attempts
    WHERE user_id = p_user_id
    AND last_attempt_at > NOW() - INTERVAL '1 hour'
    AND attempt_count > 0;
    
    -- 過去24時間の異なるIPアドレス数をチェック
    SELECT COUNT(DISTINCT ip_address) INTO different_ip_count
    FROM security_logs
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '24 hours';
    
    -- 怪しいアクティビティの判定条件
    RETURN (recent_failed_attempts > 5 OR different_ip_count > 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー設定

-- admin_users テーブルの更新時に updated_at を自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- セキュリティログの自動削除（90日以上古いログを削除）
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM security_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- コメント追加
COMMENT ON TABLE login_attempts IS 'ログイン試行制限のためのテーブル';
COMMENT ON TABLE security_logs IS 'セキュリティイベントログテーブル';
COMMENT ON TABLE ip_restrictions IS 'IP制限管理テーブル';
COMMENT ON TABLE file_upload_restrictions IS 'ファイルアップロード制限テーブル'; 