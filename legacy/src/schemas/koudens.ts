import { z } from "zod";

export const koudenSchema = z.object({
	title: z.string().min(1, "香典帳のタイトルを入力してください"),
	description: z.string().optional(),
});

/**
 * 新しい香典帳作成フォーム用のバリデーションスキーマ
 */
export const newKoudenFormSchema = z.object({
	title: z
		.string()
		.min(1, "タイトルを入力してください")
		.max(100, "タイトルは100文字以内で入力してください"),
	description: z
		.string()
		.max(500, "説明は500文字以内で入力してください")
		.optional()
		.or(z.literal("")),
	planCode: z.string().min(1, "プランを選択してください"),
	expectedCount: z
		.number()
		.min(10, "予想件数は10件以上で入力してください")
		.max(1000, "予想件数は1000件以下で入力してください")
		.optional(),
});

export type NewKoudenFormValues = z.infer<typeof newKoudenFormSchema>;
