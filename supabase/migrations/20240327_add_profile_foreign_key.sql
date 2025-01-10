-- koudensテーブルのowner_idとcreated_byをprofilesテーブルのidに関連付ける
ALTER TABLE koudens
DROP CONSTRAINT IF EXISTS koudens_owner_id_fkey,
DROP CONSTRAINT IF EXISTS koudens_created_by_fkey;

ALTER TABLE koudens
ADD CONSTRAINT koudens_owner_id_fkey
    FOREIGN KEY (owner_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

ALTER TABLE koudens
ADD CONSTRAINT koudens_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE CASCADE; 