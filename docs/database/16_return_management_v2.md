# 返礼品管理システム v2 - 実装ドキュメント

## 概要

返礼品管理システムv2では、従来の複雑な設計を見直し、より効率的で直感的なデータベース設計に変更しました。
香典エントリー単位での返礼管理を基本とし、お供物も含めた総合的な返礼判断ができるシステムとなっています。

## 設計変更の背景

### 従来の設計の問題点

1. **二重管理による複雑性**
   - `return_records` (香典帳レベル) と `return_record_entries` (エントリーレベル) の二重構造
   - データの整合性維持が困難
   - フロントエンド実装時の混乱

2. **不適切な外部キー参照**
   - `return_records.koden_id` が `koudens.id` を参照していたが、実際には個別エントリー管理が必要
   - 香典帳レベルでの管理では個別返礼の詳細管理ができない

3. **手動計算による非効率性**
   - `assigned_amount` の計算が手動
   - お供物追加時の合計金額更新が漏れやすい

4. **機能不足**
   - 会葬品による一括返礼処理機能がない
   - 返礼進捗の可視化が困難

### 新設計の方針

1. **シンプルな単一テーブル構造**
2. **自動計算による整合性保証**
3. **香典エントリー主体の管理**
4. **ビューによる効率的なデータ取得**

## データベース設計

### メインテーブル: `return_entry_records`

```sql
CREATE TABLE return_entry_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  kouden_entry_id uuid NOT NULL REFERENCES kouden_entries(id) ON DELETE CASCADE,
  
  -- 自動計算される合計金額（香典 + お供物）
  total_amount bigint NOT NULL DEFAULT 0,
  
  -- 返礼状況
  return_status text NOT NULL DEFAULT 'PENDING' 
    CHECK (return_status IN ('PENDING', 'PARTIAL_RETURNED', 'COMPLETED', 'NOT_REQUIRED')),
  
  -- 会葬品で返礼済みの金額
  funeral_gift_amount bigint NOT NULL DEFAULT 0,
  
  -- 追加返礼が必要な金額（計算カラム）
  additional_return_amount bigint GENERATED ALWAYS AS (
    GREATEST(0, total_amount - funeral_gift_amount)
  ) STORED,
  
  -- 返礼方法と内容
  return_method text,
  return_items jsonb, -- 返礼品の詳細情報
  
  -- 手配情報
  arrangement_date date,
  remarks text,
  
  -- 監査フィールド
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  
  -- 制約
  CONSTRAINT unique_kouden_entry_return_record UNIQUE (kouden_entry_id)
);
```

#### カラム詳細

| カラム名 | データ型 | 説明 |
|----------|----------|------|
| `id` | uuid | 主キー |
| `kouden_entry_id` | uuid | 香典エントリーID（一意制約） |
| `total_amount` | bigint | 香典金額 + お供物合計（自動計算） |
| `return_status` | text | 返礼ステータス |
| `funeral_gift_amount` | bigint | 会葬品返礼額 |
| `additional_return_amount` | bigint | 追加返礼必要額（計算カラム） |
| `return_method` | text | 返礼方法 |
| `return_items` | jsonb | 返礼品詳細（JSON形式） |
| `arrangement_date` | date | 手配日 |
| `remarks` | text | 備考 |

#### 返礼ステータス

- `PENDING`: 未対応
- `PARTIAL_RETURNED`: 一部返礼済み（会葬品のみ等）
- `COMPLETED`: 返礼完了
- `NOT_REQUIRED`: 返礼不要

## データベース関数

### 1. 合計金額自動計算関数

```sql
CREATE OR REPLACE FUNCTION calculate_total_amount(entry_id uuid)
RETURNS bigint AS $$
DECLARE
  kouden_amount bigint;
  offering_total bigint;
BEGIN
  -- 香典金額を取得
  SELECT amount INTO kouden_amount
  FROM kouden_entries 
  WHERE id = entry_id;
  
  -- 紐づくお供物の合計金額を取得
  SELECT COALESCE(SUM(o.price), 0) INTO offering_total
  FROM offering_entries oe
  JOIN offerings o ON oe.offering_id = o.id
  WHERE oe.kouden_entry_id = entry_id
    AND o.price IS NOT NULL;
  
  RETURN COALESCE(kouden_amount, 0) + COALESCE(offering_total, 0);
END;
$$ LANGUAGE plpgsql;
```

この関数は香典エントリーの金額とお供物の合計金額を自動計算します。

### 2. 会葬品一括返礼処理関数

```sql
CREATE OR REPLACE FUNCTION bulk_mark_funeral_gift_returned(
  kouden_id_param uuid,
  funeral_gift_amount_param bigint,
  performed_by uuid DEFAULT NULL
)
RETURNS TABLE (
  updated_count integer,
  affected_entries jsonb
) AS $$
```

**機能:**
- 指定した香典帳の全エントリーに会葬品返礼額を一括設定
- 返礼ステータスの自動更新
- 処理結果の詳細情報を返却

**使用例:**
```sql
SELECT * FROM bulk_mark_funeral_gift_returned(
  '香典帳ID', 
  3000,  -- 会葬品金額
  'ユーザーID'
);
```

### 3. 個別返礼状況更新関数

```sql
CREATE OR REPLACE FUNCTION update_return_status(
  entry_id uuid,
  new_status text,
  new_funeral_gift_amount bigint DEFAULT NULL,
  return_method_param text DEFAULT NULL,
  return_items_param jsonb DEFAULT NULL,
  arrangement_date_param date DEFAULT NULL,
  remarks_param text DEFAULT NULL
)
RETURNS boolean AS $$
```

**機能:**
- 個別エントリーの返礼情報を更新
- 必要な項目のみ更新（NULL以外のパラメータのみ）

## トリガー

### 1. total_amount自動更新トリガー

```sql
CREATE TRIGGER trigger_update_return_entry_total
  BEFORE INSERT OR UPDATE OF kouden_entry_id
  ON return_entry_records
  FOR EACH ROW
  EXECUTE FUNCTION update_return_entry_total();
```

**動作:**
- レコード挿入/更新時に `total_amount` を自動計算

### 2. お供物変更時の自動更新トリガー

```sql
CREATE TRIGGER trigger_offering_entries_change
  AFTER INSERT OR UPDATE OR DELETE
  ON offering_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_related_return_entries();
```

**動作:**
- お供物の追加/変更/削除時に関連する返礼レコードの `total_amount` を自動更新

## ビュー

### 1. 返礼品管理一覧ビュー

```sql
CREATE VIEW return_management_summary AS
SELECT 
  ke.kouden_id,
  ke.id as kouden_entry_id,
  ke.name,
  ke.organization,
  ke.position,
  r.name as relationship_name,
  ke.amount as kouden_amount,
  
  -- お供物情報
  COALESCE(offering_summary.offering_count, 0) as offering_count,
  COALESCE(offering_summary.offering_total, 0) as offering_total,
  
  -- 返礼品情報
  COALESCE(rer.total_amount, ke.amount + COALESCE(offering_summary.offering_total, 0)) as total_amount,
  COALESCE(rer.return_status, 'PENDING') as return_status,
  COALESCE(rer.funeral_gift_amount, 0) as funeral_gift_amount,
  COALESCE(rer.additional_return_amount, ke.amount + COALESCE(offering_summary.offering_total, 0)) as additional_return_amount,
  rer.return_method,
  rer.return_items,
  rer.arrangement_date,
  rer.remarks,
  
  -- 表示用フィールド
  CASE 
    WHEN COALESCE(rer.return_status, 'PENDING') = 'COMPLETED' THEN '返礼完了'
    WHEN COALESCE(rer.return_status, 'PENDING') = 'PARTIAL_RETURNED' THEN '一部返礼済'
    WHEN COALESCE(rer.return_status, 'PENDING') = 'NOT_REQUIRED' THEN '返礼不要'
    ELSE '未対応'
  END as status_display,
  
  ((ke.amount + COALESCE(offering_summary.offering_total, 0)) > COALESCE(rer.funeral_gift_amount, 0)) as needs_additional_return

FROM kouden_entries ke
LEFT JOIN relationships r ON ke.relationship_id = r.id
LEFT JOIN offering_summary ON ke.id = offering_summary.kouden_entry_id
LEFT JOIN return_entry_records rer ON ke.id = rer.kouden_entry_id;
```

**用途:**
- 香典帳詳細ページでの返礼品一覧表示
- 個別エントリーの詳細情報と返礼状況を一括取得

### 2. 香典帳レベルサマリービュー

```sql
CREATE VIEW kouden_return_summary AS
SELECT 
  k.id as kouden_id,
  k.title,
  k.description,
  
  -- エントリー数統計
  COUNT(rms.kouden_entry_id) as total_entries,
  COUNT(CASE WHEN rms.return_status = 'COMPLETED' THEN 1 END) as completed_count,
  COUNT(CASE WHEN rms.return_status = 'PARTIAL_RETURNED' THEN 1 END) as partial_count,
  COUNT(CASE WHEN rms.return_status = 'PENDING' THEN 1 END) as pending_count,
  COUNT(CASE WHEN rms.needs_additional_return THEN 1 END) as needs_additional_count,
  
  -- 金額統計
  SUM(rms.total_amount) as total_amount_sum,
  SUM(rms.funeral_gift_amount) as funeral_gift_amount_sum,
  SUM(rms.additional_return_amount) as additional_return_amount_sum,
  
  -- 進捗率
  ROUND(
    COUNT(CASE WHEN rms.return_status = 'COMPLETED' THEN 1 END)::numeric / 
    NULLIF(COUNT(rms.kouden_entry_id), 0) * 100, 
    1
  ) as completion_rate

FROM koudens k
LEFT JOIN return_management_summary rms ON k.id = rms.kouden_id
GROUP BY k.id, k.title, k.description;
```

**用途:**
- 香典帳一覧での返礼進捗表示
- ダッシュボードでの統計情報表示

## インデックス

```sql
-- 主要検索用インデックス
CREATE INDEX idx_return_entry_records_kouden_entry_id 
  ON return_entry_records(kouden_entry_id);
CREATE INDEX idx_return_entry_records_status 
  ON return_entry_records(return_status);
CREATE INDEX idx_return_entry_records_arrangement_date 
  ON return_entry_records(arrangement_date);

-- ビューの高速化
CREATE INDEX idx_kouden_entries_kouden_id 
  ON kouden_entries(kouden_id);
CREATE INDEX idx_offering_entries_kouden_entry_id 
  ON offering_entries(kouden_entry_id);
```

## フロントエンド実装例

### 返礼品一覧取得

```typescript
// 香典帳詳細ページでの返礼品一覧
const { data: returnList, error } = await supabase
  .from('return_management_summary')
  .select('*')
  .eq('kouden_id', koudenId)
  .order('name');
```

### 会葬品一括返礼処理

```typescript
// 会葬品一括返礼
const { data, error } = await supabase
  .rpc('bulk_mark_funeral_gift_returned', {
    kouden_id_param: koudenId,
    funeral_gift_amount_param: 3000
  });

if (data) {
  console.log(`${data[0].updated_count}件のエントリーを更新しました`);
}
```

### 個別返礼状況更新

```typescript
// 個別エントリーの返礼状況更新
const { data, error } = await supabase
  .rpc('update_return_status', {
    entry_id: entryId,
    new_status: 'COMPLETED',
    return_method_param: 'カタログギフト',
    return_items_param: {
      items: [
        { name: "商品A", price: 3000, quantity: 1 }
      ]
    },
    arrangement_date_param: '2024-03-01',
    remarks_param: '配送完了'
  });
```

### 香典帳サマリー取得

```typescript
// 香典帳の返礼進捗サマリー
const { data: summary } = await supabase
  .from('kouden_return_summary')
  .select('*')
  .eq('kouden_id', koudenId)
  .single();

console.log(`返礼完了率: ${summary.completion_rate}%`);
```

## セキュリティ（RLS ポリシー）

```sql
-- return_entry_recordsのRLSポリシー例
CREATE POLICY "Users can manage return records for their koudens" 
  ON return_entry_records
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM kouden_entries ke
      JOIN koudens k ON ke.kouden_id = k.id
      WHERE ke.id = return_entry_records.kouden_entry_id
        AND k.owner_id = auth.uid()
    )
  );
```

## 移行処理

既存の`return_records`と`return_record_entries`からの移行は以下で実行済み：

```sql
-- 既存データの移行
INSERT INTO return_entry_records (
  kouden_entry_id,
  total_amount,
  return_status,
  created_by,
  created_at,
  updated_at
)
SELECT 
  rre.kouden_entry_id,
  rre.assigned_amount,
  'PENDING' as return_status,
  rre.created_by,
  rre.created_at,
  rre.updated_at
FROM return_record_entries rre
ON CONFLICT (kouden_entry_id) DO NOTHING;
```

## まとめ

### 改善点

1. **設計のシンプル化**: 二重管理を解消し、香典エントリー主体の単一テーブル構造
2. **自動計算**: お供物を含む合計金額の自動計算で整合性を保証
3. **効率的なデータ取得**: ビューによる最適化されたデータアクセス
4. **機能強化**: 会葬品一括処理、進捗可視化機能を追加
5. **保守性向上**: トリガーによる自動更新で手動メンテナンスを削減

### 旧設計からの変更点

- `return_records` + `return_record_entries` → `return_entry_records` に統合
- 手動計算 → 自動計算（トリガー）
- 複雑な外部キー関係 → シンプルな一対一関係
- 静的データ → 動的計算カラム（`additional_return_amount`）

この新設計により、返礼品管理の効率性と正確性が大幅に向上しました。 