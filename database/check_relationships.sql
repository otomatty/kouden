-- 特定のkouden_idに登録されているrelationshipsを確認
SELECT 
    id,
    name,
    description,
    is_default,
    created_at,
    created_by
FROM relationships 
WHERE kouden_id = '003d669e-f062-4079-9fe7-28fe069cc271'
ORDER BY 
    is_default DESC,  -- デフォルトのrelationshipを先に表示
    name ASC;         -- 次に名前でソート 