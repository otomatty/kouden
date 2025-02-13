import { z } from "zod";

// Server Actionsのバリデーション
export const entrySchema = z
	.object({
		koudenId: z.string().uuid("香典帳IDが不正です"),
		name: z.string().min(1, "名前を入力してください"),
		organization: z.string().nullable(),
		position: z.string().nullable(),
		amount: z.number().min(1, "金額を入力してください"),
		postalCode: z
			.string()
			.nullable()
			.refine((val) => !val || /^\d{3}-?\d{4}$/.test(val), "正しい郵便番号形式で入力してください"),
		address: z.string().nullable(),
		phoneNumber: z
			.string()
			.nullable()
			.refine(
				(val) => !val || /^\d{2,4}-?\d{2,4}-?\d{4}$/.test(val),
				"正しい電話番号形式で入力してください",
			),
		attendanceType: z.enum(["FUNERAL", "CONDOLENCE_VISIT", "ABSENT"]).default("ABSENT"),
		hasOffering: z.boolean().default(false),
		isReturnCompleted: z.boolean().default(false),
		notes: z.string().nullable(),
		relationshipId: z.string().uuid("関係性IDが不正です").nullable(),
	})
	.strict();

// フォームのバリデーションスキーマ
export const entryFormSchema = z
	.object({
		name: z.string().min(1, "名前を入力してください"),
		organization: z.string().nullable(),
		position: z.string().nullable(),
		amount: z.number().min(1, "金額を入力してください"),
		postalCode: z
			.string()
			.nullable()
			.refine((val) => !val || /^\d{3}-?\d{4}$/.test(val), "正しい郵便番号形式で入力してください"),
		address: z.string().nullable(),
		phoneNumber: z
			.string()
			.nullable()
			.refine(
				(val) => !val || /^\d{2,4}-?\d{2,4}-?\d{4}$/.test(val),
				"正しい電話番号形式で入力してください",
			),
		relationshipId: z.string().uuid("関係性IDが不正です").nullable(),
		attendanceType: z.enum(["FUNERAL", "CONDOLENCE_VISIT", "ABSENT"]).default("ABSENT"),
		notes: z.string().nullable(),
		koudenId: z.string().uuid("香典帳IDが不正です"),
	})
	.strict();
