-- Alter kouden_entries table to make address column nullable
ALTER TABLE kouden_entries ALTER COLUMN address DROP NOT NULL;

-- Add comment to the address column
COMMENT ON COLUMN kouden_entries.address IS '住所（任意）'; 