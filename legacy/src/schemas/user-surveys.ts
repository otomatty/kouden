import { z } from "zod";

// アンケート回答のバリデーションスキーマ
export const userSurveySchema = z
	.object({
		surveyTrigger: z.enum(["pdf_export", "one_week_usage"], {
			required_error: "アンケートのトリガータイプが不正です",
		}),
		overallSatisfaction: z
			.number()
			.int("満足度は整数で入力してください")
			.min(1, "満足度は1以上で選択してください")
			.max(5, "満足度は5以下で選択してください"),
		npsScore: z
			.number()
			.int("NPSスコアは整数で入力してください")
			.min(0, "NPSスコアは0以上で選択してください")
			.max(10, "NPSスコアは10以下で選択してください"),

		// 操作性改善要望
		usabilityEasierInput: z.boolean().default(false),
		usabilityBetterUi: z.boolean().default(false),
		usabilityFasterPerformance: z.boolean().default(false),
		usabilityOther: z
			.string()
			.max(100, "操作性その他は100文字以内で入力してください")
			.nullable()
			.optional(),

		// 機能追加要望
		featureVoiceInput: z.boolean().default(false),
		featurePhotoAttachment: z.boolean().default(false),
		featureExcelIntegration: z.boolean().default(false),
		featurePrintLayout: z.boolean().default(false),
		featureOther: z
			.string()
			.max(100, "機能追加その他は100文字以内で入力してください")
			.nullable()
			.optional(),

		// 自由記述
		additionalFeedback: z
			.string()
			.max(500, "追加フィードバックは500文字以内で入力してください")
			.nullable()
			.optional(),
	})
	.strict();

// フロントエンド用のフォームスキーマ（より緩い検証）
export const userSurveyFormSchema = z
	.object({
		overallSatisfaction: z
			.number()
			.int("満足度は必須項目です")
			.min(1, "満足度を選択してください")
			.max(5, "満足度を正しく選択してください"),
		npsScore: z
			.number()
			.int("推奨度は必須項目です")
			.min(0, "推奨度を選択してください")
			.max(10, "推奨度を正しく選択してください"),

		// 操作性改善要望（任意）
		usabilityEasierInput: z.boolean().optional(),
		usabilityBetterUi: z.boolean().optional(),
		usabilityFasterPerformance: z.boolean().optional(),
		usabilityOther: z.string().max(100, "100文字以内で入力してください").optional(),

		// 機能追加要望（任意）
		featureVoiceInput: z.boolean().optional(),
		featurePhotoAttachment: z.boolean().optional(),
		featureExcelIntegration: z.boolean().optional(),
		featurePrintLayout: z.boolean().optional(),
		featureOther: z.string().max(100, "100文字以内で入力してください").optional(),

		// 自由記述（任意）
		additionalFeedback: z.string().max(500, "500文字以内で入力してください").optional(),
	})
	.strict();

// 型エクスポート
export type UserSurveyInput = z.infer<typeof userSurveySchema>;
export type UserSurveyFormInput = z.infer<typeof userSurveyFormSchema>;

// アンケートトリガータイプ
export type SurveyTrigger = "pdf_export" | "one_week_usage";

// 回答状況の型定義
export type SurveyStatus = {
	hasAnswered: boolean;
	isSkipped?: boolean;
	surveyData?: UserSurveyInput & {
		id: string;
		userId: string;
		createdAt: string | null;
		updatedAt: string | null;
	};
};
