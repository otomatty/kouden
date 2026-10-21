-- Drop existing function if it exists
DROP FUNCTION IF EXISTS add_kouden_owner CASCADE;

-- Create function to add kouden owner as a member
CREATE OR REPLACE FUNCTION add_kouden_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- 香典帳のオーナーをメンバーとして追加
    INSERT INTO kouden_members (
        kouden_id,
        user_id,
        role
    ) VALUES (
        NEW.id,
        NEW.owner_id,
        'editor'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_add_kouden_owner ON koudens;
CREATE TRIGGER trigger_add_kouden_owner
    AFTER INSERT ON koudens
    FOR EACH ROW
    EXECUTE FUNCTION add_kouden_owner(); 