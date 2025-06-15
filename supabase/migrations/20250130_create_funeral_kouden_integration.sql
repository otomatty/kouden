-- 葬儀管理システムと香典帳の連携テーブル
-- 葬儀会社が香典帳を代理管理するための仕組み

-- 1. 葬儀案件と香典帳の連携テーブル
CREATE TABLE IF NOT EXISTS funeral.kouden_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    case_id UUID NOT NULL,
    kouden_id UUID NOT NULL,
    proxy_manager_id UUID NOT NULL, -- 葬儀会社の担当者
    family_user_id UUID, -- ご遺族のユーザーID（後で設定される場合がある）
    status VARCHAR(50) NOT NULL DEFAULT 'proxy_managed', -- proxy_managed, transferred, completed
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE,
    
    -- 制約
    CONSTRAINT fk_kouden_cases_org FOREIGN KEY (organization_id)
        REFERENCES common.organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_kouden_cases_case FOREIGN KEY (case_id)
        REFERENCES funeral.cases(id) ON DELETE CASCADE,
    CONSTRAINT fk_kouden_cases_kouden FOREIGN KEY (kouden_id)
        REFERENCES public.koudens(id) ON DELETE CASCADE,
    CONSTRAINT fk_kouden_cases_proxy_manager FOREIGN KEY (proxy_manager_id)
        REFERENCES public.profiles(id),
    CONSTRAINT fk_kouden_cases_family_user FOREIGN KEY (family_user_id)
        REFERENCES public.profiles(id),
    CONSTRAINT chk_kouden_cases_status CHECK (status IN ('proxy_managed', 'transferred', 'completed')),
    
    -- 一つの案件に対して一つの香典帳のみ
    UNIQUE(case_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_kouden_cases_org ON funeral.kouden_cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_kouden_cases_case ON funeral.kouden_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_kouden_cases_kouden ON funeral.kouden_cases(kouden_id);
CREATE INDEX IF NOT EXISTS idx_kouden_cases_proxy_manager ON funeral.kouden_cases(proxy_manager_id);
CREATE INDEX IF NOT EXISTS idx_kouden_cases_status ON funeral.kouden_cases(status);

-- 2. 香典帳の代理管理権限を管理するロール拡張
-- 既存のkouden_rolesテーブルに新しいロールタイプを追加するための関数
CREATE OR REPLACE FUNCTION create_funeral_company_role(
    p_kouden_id UUID,
    p_created_by UUID
) RETURNS UUID AS $$
DECLARE
    v_role_id UUID;
BEGIN
    -- 葬儀会社管理者ロールを作成
    INSERT INTO kouden_roles (
        kouden_id,
        name,
        description,
        permissions,
        created_by
    ) VALUES (
        p_kouden_id,
        'funeral_company_manager',
        '葬儀会社の代理管理者として香典記帳と返礼品管理が可能',
        ARRAY['view', 'edit', 'manage_entries', 'manage_returns']::TEXT[],
        p_created_by
    )
    RETURNING id INTO v_role_id;
    
    RETURN v_role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 葬儀会社による香典帳作成関数
CREATE OR REPLACE FUNCTION create_kouden_for_funeral_case(
    p_case_id UUID,
    p_organization_id UUID,
    p_proxy_manager_id UUID,
    p_title TEXT,
    p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_kouden_id UUID;
    v_role_id UUID;
    v_plan_id UUID;
BEGIN
    -- freeプランIDを取得
    SELECT id INTO v_plan_id
    FROM plans
    WHERE code = 'free'
    LIMIT 1;
    
    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'フリープランが見つかりません';
    END IF;
    
    -- 香典帳を作成（代理管理者が作成者兼所有者として設定）
    INSERT INTO koudens (
        title,
        description,
        owner_id,
        created_by,
        plan_id,
        status
    ) VALUES (
        p_title,
        p_description,
        p_proxy_manager_id, -- 初期は葬儀会社担当者が所有者
        p_proxy_manager_id,
        v_plan_id,
        'active'
    )
    RETURNING id INTO v_kouden_id;
    
    -- 葬儀案件と香典帳の連携レコードを作成
    INSERT INTO funeral.kouden_cases (
        organization_id,
        case_id,
        kouden_id,
        proxy_manager_id,
        status
    ) VALUES (
        p_organization_id,
        p_case_id,
        v_kouden_id,
        p_proxy_manager_id,
        'proxy_managed'
    );
    
    -- 葬儀会社管理者ロールを作成
    SELECT create_funeral_company_role(v_kouden_id, p_proxy_manager_id) INTO v_role_id;
    
    -- 代理管理者をメンバーとして追加（既存のトリガーで編集者ロールが追加されるが、追加で葬儀会社ロールも付与）
    INSERT INTO kouden_members (
        kouden_id,
        user_id,
        role_id,
        added_by
    ) VALUES (
        v_kouden_id,
        p_proxy_manager_id,
        v_role_id,
        p_proxy_manager_id
    );
    
    RETURN v_kouden_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 所有権移譲関数
CREATE OR REPLACE FUNCTION transfer_kouden_ownership(
    p_kouden_id UUID,
    p_new_owner_id UUID,
    p_proxy_manager_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_case_record RECORD;
    v_editor_role_id UUID;
BEGIN
    -- 権限チェック：代理管理者のみが実行可能
    SELECT * INTO v_case_record
    FROM funeral.kouden_cases
    WHERE kouden_id = p_kouden_id
    AND proxy_manager_id = p_proxy_manager_id
    AND status = 'proxy_managed';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '権限がありません';
    END IF;
    
    -- 香典帳の所有者を変更
    UPDATE koudens
    SET owner_id = p_new_owner_id,
        updated_at = now()
    WHERE id = p_kouden_id;
    
    -- 新しい所有者に編集者ロールを付与
    SELECT id INTO v_editor_role_id
    FROM kouden_roles
    WHERE kouden_id = p_kouden_id
    AND name = 'editor'
    LIMIT 1;
    
    IF v_editor_role_id IS NOT NULL THEN
        INSERT INTO kouden_members (
            kouden_id,
            user_id,
            role_id,
            added_by
        ) VALUES (
            p_kouden_id,
            p_new_owner_id,
            v_editor_role_id,
            p_proxy_manager_id
        )
        ON CONFLICT (kouden_id, user_id) DO NOTHING;
    END IF;
    
    -- 連携レコードのステータスを更新
    UPDATE funeral.kouden_cases
    SET family_user_id = p_new_owner_id,
        status = 'transferred',
        updated_at = now()
    WHERE id = v_case_record.id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS設定
ALTER TABLE funeral.kouden_cases ENABLE ROW LEVEL SECURITY;

-- 組織メンバーのみアクセス可能
CREATE POLICY kouden_cases_org_access ON funeral.kouden_cases
    FOR ALL
    USING (organization_id = current_setting('request.jwt.claims.organization_id')::uuid);

-- 代理管理者は自分が管理する香典帳にアクセス可能
CREATE POLICY kouden_cases_proxy_manager_access ON funeral.kouden_cases
    FOR ALL
    USING (proxy_manager_id = auth.uid());

-- 6. 香典帳のRLSポリシーを拡張（葬儀会社の代理管理を許可）
CREATE POLICY funeral_company_proxy_access ON public.koudens
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM funeral.kouden_cases fkc
            WHERE fkc.kouden_id = koudens.id
            AND fkc.proxy_manager_id = auth.uid()
            AND fkc.status IN ('proxy_managed', 'transferred')
        )
    );

-- 7. 香典記録のRLSポリシーも拡張
CREATE POLICY funeral_company_entries_access ON public.kouden_entries
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM funeral.kouden_cases fkc
            WHERE fkc.kouden_id = kouden_entries.kouden_id
            AND fkc.proxy_manager_id = auth.uid()
            AND fkc.status IN ('proxy_managed', 'transferred')
        )
    );

-- 8. 更新日時トリガー
CREATE OR REPLACE FUNCTION update_kouden_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kouden_cases_updated_at
    BEFORE UPDATE ON funeral.kouden_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_kouden_cases_updated_at(); 