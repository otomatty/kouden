import { z } from "zod";

// Server Actionsのバリデーション
export const entrySchema = z.object({
	kouden_id: z.string().uuid(),
	name: z.string().nullish(),
	organization: z.string().nullish(),
	position: z.string().nullish(),
	amount: z.number().min(1, "金額を入力してください"),
	postalCode: z.string().nullish(),
	address: z.string().nullish(),
	phoneNumber: z.string().nullish(),
	attendanceType: z.enum(["FUNERAL", "CONDOLENCE_VISIT", "ABSENT"]).nullish(),
	hasOffering: z.boolean().default(false),
	isReturnCompleted: z.boolean().default(false),
	notes: z.string().nullish(),
	relationshipId: z.string().uuid().nullish(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
	createdBy: z.string().uuid().optional(),
	version: z.number().optional(),
});

// フォームのバリデーションスキーマ
export const entryFormSchema = z.object({
	name: z.string().nullable(),
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
	relationshipId: z.string().uuid().nullable(),
	attendanceType: z.enum(["FUNERAL", "CONDOLENCE_VISIT", "ABSENT"]),
	hasOffering: z.boolean(),
	isReturnCompleted: z.boolean(),
	notes: z.string().nullable(),
});
