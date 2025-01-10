-- デフォルトの関係性を初期化する関数
CREATE OR REPLACE FUNCTION initialize_default_relationships(admin_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- デフォルトの関係性を挿入
    INSERT INTO relationships (name, description, is_default, created_by)
    VALUES
        ('仕事関係', '職場の同僚や取引先など', TRUE, admin_user_id),
        ('友人', '友人や知人など', TRUE, admin_user_id),
        ('親族', '親族や家族など', TRUE, admin_user_id)
    ON CONFLICT DO NOTHING;
END;
$$; 