-- Drop existing trigger first to avoid dependency issues
DROP TRIGGER IF EXISTS trigger_initialize_default_relationships ON koudens;

-- Drop all existing functions with the same name
DROP FUNCTION IF EXISTS initialize_default_relationships();
DROP FUNCTION IF EXISTS initialize_default_relationships(UUID);

-- Create function to initialize default relationships
CREATE OR REPLACE FUNCTION initialize_default_relationships()
RETURNS TRIGGER AS $$
BEGIN
    -- デフォルトの関係性を追加
    INSERT INTO relationships (
        kouden_id,
        name,
        description,
        is_default,
        is_enabled,
        created_by
    ) VALUES
    (NEW.id, '親族', '故人の親族', true, true, NEW.created_by),
    (NEW.id, '友人', '故人の友人', true, true, NEW.created_by),
    (NEW.id, '知人', '故人の知人', true, true, NEW.created_by),
    (NEW.id, '会社関係', '故人の会社関係者', true, true, NEW.created_by),
    (NEW.id, '近所', '故人の近所の方', true, true, NEW.created_by),
    (NEW.id, 'その他', 'その他の関係', true, true, NEW.created_by);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_initialize_default_relationships
    AFTER INSERT ON koudens
    FOR EACH ROW
    EXECUTE FUNCTION initialize_default_relationships(); 