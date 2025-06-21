# ユーザーアンケート機能 実装計画書

## 概要

香典帳アプリのユーザーフィードバック収集を目的としたアンケート機能の実装計画です。
ユーザーの負担を最小限に抑えつつ、効果的なフィードバックを収集する仕組みを構築します。

## アンケート仕様

### 実施タイミング
1. **PDF出力完了後** - 成功体験直後の満足度が高いタイミング
2. **アプリ利用開始から1週間後** - 継続利用後の総合的な評価

### 表示条件
- 両タイミング共通のアンケート内容
- **1回のみ回答**（どちらかのタイミングで回答済みの場合は以降表示しない）
- ログインユーザーのみ対象

### アンケート内容

#### Q1: 全体的な満足度
```
香典帳アプリの全体的な満足度を教えてください
○ 非常に満足（5）
○ 満足（4）
○ 普通（3）
○ やや不満（2）
○ 非常に不満（1）
```

#### Q2: 推奨度（NPS）
```
このアプリを他の人に勧める可能性はどの程度ですか？
[0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
全く勧めない ←→ 非常に勧めたい
```

#### Q3: 改善提案・要望
```
改善してほしい点や追加してほしい機能があれば教えてください

【操作性について】
□ 入力がもっと簡単になってほしい
□ 画面がもっと見やすくなってほしい
□ 動作がもっと速くなってほしい
□ その他：＿＿＿＿＿＿＿

【機能について】
□ 音声入力機能
□ 写真添付機能
□ エクセル連携機能
□ 印刷レイアウト選択
□ その他：＿＿＿＿＿＿＿

【その他のご意見・ご要望】
＿＿＿＿＿＿＿＿＿＿＿（任意・200文字以内）
```

## 技術実装

### データベース設計

#### テーブル: user_surveys
```sql
CREATE TABLE user_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  survey_trigger VARCHAR(50) NOT NULL, -- 'pdf_export' | 'one_week_usage'
  overall_satisfaction INTEGER NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  nps_score INTEGER NOT NULL CHECK (nps_score >= 0 AND nps_score <= 10),
  
  -- 操作性改善要望
  usability_easier_input BOOLEAN DEFAULT FALSE,
  usability_better_ui BOOLEAN DEFAULT FALSE,
  usability_faster_performance BOOLEAN DEFAULT FALSE,
  usability_other TEXT,
  
  -- 機能追加要望
  feature_voice_input BOOLEAN DEFAULT FALSE,
  feature_photo_attachment BOOLEAN DEFAULT FALSE,
  feature_excel_integration BOOLEAN DEFAULT FALSE,
  feature_print_layout BOOLEAN DEFAULT FALSE,
  feature_other TEXT,
  
  -- 自由記述
  additional_feedback TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- 1ユーザー1回のみ
);
```

#### RLS ポリシー
```sql
-- 自分のアンケート結果のみ参照可能
CREATE POLICY "Users can view own surveys" ON user_surveys
  FOR SELECT USING (auth.uid() = user_id);

-- 自分のアンケートのみ作成可能
CREATE POLICY "Users can create own surveys" ON user_surveys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### フロントエンド実装

#### 1. Server Actions

**ファイル**: `src/app/_actions/user-surveys.ts` ✅**実装完了**
```typescript
'use server'

// ✅ 実装済み - アンケート回答を作成
export async function createUserSurvey(formData: UserSurveyFormInput, trigger: SurveyTrigger) {
  // Zodバリデーション、重複チェック、データベース保存
  // 適切なエラーハンドリングとメッセージ返却
}

// ✅ 実装済み - ユーザーのアンケート回答状況を確認
export async function getUserSurveyStatus(): Promise<SurveyStatus> {
  // 未回答の場合は { hasAnswered: false }
  // 回答済みの場合は { hasAnswered: true, surveyData: {...} } を返す
}

// ✅ 実装済み - 1週間経過した香典帳と未回答状況をチェック
export async function checkOneWeekOwnershipSurvey(): Promise<boolean> {
  // オーナーとして作成した香典帳で1週間経過 && アンケート未回答の場合true
}

// ✅ 実装済み - 管理者用アナリティクス
export async function getAdminSurveyAnalytics() {
  // NPS計算、基本統計、生データ返却（管理者権限チェック付き）
}
```

#### 2. スキーマ定義

**ファイル**: `src/schemas/user-surveys.ts` ✅**実装完了**
```typescript
// ✅ 実装済み - Zodバリデーションスキーマ
export const userSurveyFormSchema = z.object({
  overallSatisfaction: z.number().min(1).max(5),
  npsScore: z.number().min(0).max(10),
  // ... 各フィールドの詳細バリデーション
});

export const userSurveySchema = userSurveyFormSchema.extend({
  surveyTrigger: z.enum(["pdf_export", "one_week_usage"]),
});

// 型定義とエクスポート
export type UserSurveyFormInput = z.infer<typeof userSurveyFormSchema>;
export type SurveyTrigger = z.infer<typeof userSurveySchema>["surveyTrigger"];
```

#### 3. コンポーネント構成

**ファイル**: `src/components/survey/survey-modal.tsx` ✅**実装完了**
```typescript
// ✅ 実装済み - 3ステップ式アンケートモーダル
interface SurveyModalProps {
  trigger: SurveyTrigger;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
// ✅ プログレスバー、所要時間表示、レスポンシブ対応、アクセシビリティ配慮済み
```

**ファイル**: `src/components/survey/survey-trigger.tsx` ✅**実装完了**
```typescript
// ✅ 実装済み - アンケート表示の判定とトリガー管理
export function SurveyTrigger({ trigger, shouldShow, onShown }: SurveyTriggerProps) {
  // ✅ ユーザーの回答状況チェック、表示タイミング制御、重複防止機能
}

// ✅ ヘルパーコンポーネントも実装済み
export function PdfExportSurveyTrigger({ showSurvey, onShown })
export function OneWeekSurveyTrigger({ onShown })
```

**ファイル**: `src/components/survey/index.ts` ✅**実装完了**
```typescript
// ✅ 実装済み - 統一エクスポート
export { SurveyModal } from "./survey-modal";
export { SurveyTrigger, PdfExportSurveyTrigger, OneWeekSurveyTrigger } from "./survey-trigger";
```

#### 4. 統合ポイント

##### PDF出力後トリガー ⏳**実装待ち**
**ファイル**: `src/components/pdf/PdfDownloadButton.tsx`
```typescript
// 📝 TODO: 既存のPDF出力コンポーネントに統合予定
import { PdfExportSurveyTrigger } from "@/components/survey";

const [showSurvey, setShowSurvey] = useState(false);

const handlePdfExport = async () => {
  try {
    // 既存のPDF出力処理
    await exportPdf();
    
    // ✅ PDF出力成功時のみアンケートトリガー
    setShowSurvey(true);
  } catch (error) {
    // sonner toast でエラー表示
    toast.error("PDF出力に失敗しました");
    // ❌ エラー時はアンケート表示しない
  }
};

// コンポーネント内で使用
<PdfExportSurveyTrigger 
  showSurvey={showSurvey} 
  onShown={() => setShowSurvey(false)} 
/>
```

##### 1週間後トリガー ⏳**実装待ち**
**ファイル**: `src/app/(protected)/layout.tsx` または `ProtectedClientLayout.tsx`
```typescript
// 📝 TODO: ProtectedLayoutに統合予定
import { OneWeekSurveyTrigger } from "@/components/survey";

// レイアウトコンポーネント内で使用
<OneWeekSurveyTrigger onShown={() => console.log("1週間後アンケート表示")} />
```

### UI/UX 設計

#### モーダルデザイン
- **サイズ**: 最大幅 500px、モバイル対応
- **色調**: 香典帳アプリに適した落ち着いた配色
- **アニメーション**: 控えめなフェードイン/アウト
- **アクセシビリティ**: キーボード操作対応、適切なaria属性

#### 表示タイミング制御
```typescript
// 段階的表示戦略
const showSurvey = () => {
  // 1. 初回：軽いバナー通知（3秒後に自動非表示）
  // 2. 3日後：スキップ可能なモーダル
  // 3. 1週間後：最終リマインド
};
```

#### 回答促進要素
- プログレスバー（1/3、2/3、完了）
- 推定回答時間の表示（「約1分で完了」）
- スキップオプションの明示
- 回答後の感謝メッセージ

### データ分析

#### 集計指標
- **回答率**: 表示回数 vs 回答完了数
- **NPS分類**: 推奨者（9-10）、中立者（7-8）、批判者（0-6）
- **満足度分布**: 1-5の各スコア分布
- **要望ランキング**: 各項目の選択率

#### ダッシュボード（管理者用）
**ファイル**: `src/app/(system)/admin/analytics/surveys/page.tsx`
- 回答数・回答率の推移
- NPS スコアの変動
- 要望項目の人気度ランキング
- 自由記述のテキスト分析

## 実装進捗状況

### Phase 1: 基盤実装 ✅**完了**
- [x] ✅ データベーステーブル作成（`user_surveys`テーブル、RLSポリシー、インデックス）
- [x] ✅ Server Actions実装（4つの関数、エラーハンドリング、型安全性）
- [x] ✅ Zodスキーマ実装（バリデーション、型定義）
- [x] ✅ 基本的なアンケートコンポーネント作成

### Phase 2: UI/UX実装 ✅**完了**
- [x] ✅ モーダルデザイン実装（3ステップ式、プログレスバー）
- [x] ✅ レスポンシブ対応（モバイル・デスクトップ）
- [x] ✅ アクセシビリティ対応（aria属性、キーボード操作）
- [x] ✅ アニメーション実装（Framer Motion、自然な表示）

### Phase 3: 統合・テスト ⏳**進行中**
- [x] ✅ PDF出力後トリガーの統合（既存PDF出力コンポーネントへの組み込み）
- [x] ✅ 1週間後トリガーの統合（ProtectedLayoutへの組み込み）
- [x] ✅ Server Actions の単体テスト実装（13テスト、全て通過）
- [x] ✅ Zodスキーマのバリデーションテスト実装（19テスト、全て通過）
- [ ] ⚠️ Reactコンポーネントテスト（基本実装完了、非同期処理の調整が必要）
- [ ] ⏸️ E2Eテスト実装

### Phase 4: 分析機能 ✅**完了**
- [x] ✅ 管理者ダッシュボード実装（NPS分析、満足度分布、機能要望ランキング）
- [x] ✅ データ集計機能（リアルタイム統計、トリガー別分析）
- [x] ✅ エクスポート機能（生データCSV、統計サマリーCSV）

## 実装完了済みファイル

### データベース
- ✅ Supabaseプロジェクト `tcqnsslsaizqwjuyvoyu` に `user_surveys` テーブル作成済み

### バックエンド
- ✅ `src/schemas/user-surveys.ts` - Zodスキーマとバリデーション
- ✅ `src/app/_actions/user-surveys.ts` - Server Actions（4つの関数）

### フロントエンド
- ✅ `src/components/survey/survey-modal.tsx` - メインアンケートモーダル
- ✅ `src/components/survey/survey-trigger.tsx` - トリガー管理コンポーネント  
- ✅ `src/components/survey/index.ts` - 統一エクスポート

### 統合完了ファイル
- ✅ `src/components/pdf/PdfDownloadButton.tsx` - PDF出力後アンケートトリガー統合済み
- ✅ `src/app/(protected)/ProtectedClientLayout.tsx` - 1週間後アンケートトリガー統合済み

### テスト実装済みファイル
- ✅ `src/app/_actions/__tests__/user-surveys.test.ts` - Server Actions の単体テスト（13テスト）
- ✅ `src/schemas/__tests__/user-surveys.test.ts` - Zodスキーマのバリデーションテスト（19テスト）
- ⚠️ `src/components/survey/__tests__/survey-trigger.test.tsx` - コンポーネントテスト（要調整）

### 管理者機能実装済みファイル
- ✅ `src/app/(system)/admin/analytics/surveys/page.tsx` - アンケート分析ダッシュボード
- ✅ `src/app/(system)/admin/analytics/surveys/_components/export-buttons.tsx` - CSVエクスポートボタン
- ✅ `src/app/_actions/admin/survey-export.ts` - CSVエクスポート用Server Actions
- ✅ `src/app/(system)/admin/_components/admin-header.tsx` - 管理者ナビゲーション（アンケート分析タブ追加）

### 実装済み機能
- ✅ 1ユーザー1回のみの制約
- ✅ PDF出力後/1週間後の両トリガー対応
- ✅ 重複表示防止機能
- ✅ NPS計算・基本統計（管理者用）
- ✅ 型安全性とエラーハンドリング
- ✅ レスポンシブデザイン
- ✅ アクセシビリティ配慮
- ✅ PDF出力成功時のみアンケート表示（エラー時は非表示）
- ✅ 成功・失敗の適切な通知（sonner toast）
- ✅ 全認証ユーザーへの1週間後自動チェック
- ✅ 管理者ダッシュボード（NPS分析、満足度分布、機能要望ランキング、最新フィードバック表示）
- ✅ CSVエクスポート機能（生データ・統計サマリー対応、Excel互換BOM付き）
- ✅ 管理者ナビゲーション統合（/admin/analytics/surveys）

## テスト計画

### 単体テスト
- [ ] Server Actions のテスト
- [ ] コンポーネントのテスト
- [ ] バリデーション機能のテスト

### 統合テスト
- [ ] アンケート表示・非表示の制御
- [ ] データ保存・取得フロー
- [ ] 重複回答防止機能

### E2Eテスト
- [ ] PDF出力後のアンケート表示
- [ ] 1週間後のアンケート表示
- [ ] 回答完了フロー
- [ ] スキップ・キャンセル操作

## 運用・改善

### A/Bテスト項目
- アンケート表示タイミング
- 文言・メッセージ内容
- インセンティブの有無

### KPI監視
- 月次回答率目標: 30%以上
- NPS スコア目標: 50以上
- 機能要望の実装率: 70%以上

### 改善サイクル
1. **月次レビュー**: 回答データの分析
2. **四半期改善**: 要望上位項目の実装検討
3. **年次見直し**: アンケート項目・手法の見直し

## セキュリティ・プライバシー

### データ保護
- 個人を特定する情報は収集しない
- 回答データの暗号化
- データ保持期間の設定（2年間）

### 透明性
- プライバシーポリシーへの明記
- データ利用目的の明示
- 削除要求への対応手順

## 技術仕様詳細

### 判定ロジック詳細

#### 1週間経過判定
```sql
-- ユーザーがオーナーとして作成した香典帳で1週間経過したものをチェック
SELECT COUNT(*) FROM koudens 
WHERE owner_id = auth.uid() 
  AND created_at <= NOW() - INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM user_surveys WHERE user_id = auth.uid()
  );
```

#### PDF出力後判定
```typescript
// PDF出力成功時のみアンケート表示判定
const shouldShowSurvey = (pdfExportSuccess: boolean, userId: string) => {
  return pdfExportSuccess && !hasUserAnsweredSurvey(userId);
};
```

### エラーハンドリング仕様

#### Server Actions
- Zodバリデーション使用
- Supabaseエラーハンドリング
- 適切なエラーメッセージ返却

#### フロントエンド
- sonner toast使用
- バリデーションエラーはフォーム下に表示
- 認証ユーザー全員対象（権限制限なし）

### 国際化対応
- 日本語のみ対応
- i18n実装は不要

---

## 実装時の技術的課題と解決策

### 型エラーの修正
- **課題**: Supabaseの`boolean | null`型と期待する`boolean`型の不一致
- **解決**: nullish coalescing operator (`??`) でデフォルト値設定
- **課題**: コンポーネント名と型名の競合（`SurveyTrigger`）
- **解決**: 型を`SurveyTriggerType`にエイリアス

### useEffect依存関係の最適化
- **課題**: `useCallback`が依存配列に含まれないESLintエラー
- **解決**: `checkShouldShowSurvey`関数を`useCallback`でメモ化

### データベース権限管理
- **課題**: 初回作成時の管理者権限チェックエラー
- **解決**: `admin_users`テーブル構造確認後、`role`カラムを使用するよう修正

## 備考

この実装により、ユーザーの負担を最小化しながら効果的なフィードバック収集が可能になります。
特に香典帳という繊細な用途を考慮し、押し付けがましくない自然な形でのアンケート実施を心がけています。

データベース管理により端末・ブラウザ跨ぎでの一貫性を保ち、エラー時のアンケート非表示により適切なタイミングでのフィードバック収集を実現します。

**完了した実装**: PDF出力コンポーネントとProtectedLayoutへの統合が完了し、基本的なアンケート機能の実装は完了しました。

**次のステップ**: E2Eテスト実装、管理者ダッシュボード、データ分析機能の開発となります。 