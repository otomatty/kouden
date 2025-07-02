import { z } from "zod";

/**
 * プラン選択用の基本バリデーションスキーマ
 */
export const planSelectorSchema = z.object({
	planCode: z.string().min(1, "プランを選択してください"),
	expectedCount: z
		.number()
		.min(10, "予想件数は10件以上で入力してください")
		.max(1000, "予想件数は1000件以下で入力してください")
		.optional(),
});

/**
 * 新規香典帳作成時のプラン選択スキーマ
 */
export const newKoudenPlanSelectorSchema = planSelectorSchema.extend({
	title: z
		.string()
		.min(1, "タイトルを入力してください")
		.max(100, "タイトルは100文字以内で入力してください"),
	description: z
		.string()
		.max(500, "説明は500文字以内で入力してください")
		.optional()
		.or(z.literal("")),
});

/**
 * アップグレード時のプラン選択スキーマ
 */
export const upgradePlanSelectorSchema = planSelectorSchema.extend({
	koudenId: z.string().uuid("香典帳IDが不正です"),
});

/**
 * プラン選択の条件付きバリデーション
 * premium_full_supportプランの場合は予想件数が必須
 */
export const validatePlanSelection = (data: { planCode: string; expectedCount?: number }) => {
	const baseValidation = planSelectorSchema.safeParse(data);

	if (!baseValidation.success) {
		return baseValidation;
	}

	// premium_full_supportプランの場合は予想件数が必須
	if (data.planCode === "premium_full_support" && !data.expectedCount) {
		return {
			success: false as const,
			error: {
				issues: [
					{
						code: "custom" as const,
						path: ["expectedCount"],
						message: "フルサポートプランでは予想件数の入力が必要です",
					},
				],
			},
		};
	}

	return baseValidation;
};

// 型エクスポート
export type PlanSelectorFormData = z.infer<typeof planSelectorSchema>;
export type NewKoudenPlanSelectorFormData = z.infer<typeof newKoudenPlanSelectorSchema>;
export type UpgradePlanSelectorFormData = z.infer<typeof upgradePlanSelectorSchema>;
