import { z } from "zod";

// 値域は src/components/contact/category-select.tsx の options から取得。
export const contactCategoryEnum = z.enum([
	"support",
	"account",
	"bug",
	"feature",
	"business",
	"other",
]);

// 空文字を nullable として扱うための前処理。フォームからは "" が来ることがある。
const emptyStringToNull = (val: unknown) =>
	typeof val === "string" && val.trim() === "" ? null : val;

export const contactRequestSchema = z.object({
	category: contactCategoryEnum,
	name: z.preprocess(
		emptyStringToNull,
		z.string().trim().max(100, "名前は100文字以内で入力してください").nullable().optional(),
	),
	email: z
		.string()
		.trim()
		.min(1, "メールアドレスを入力してください")
		.email("正しいメールアドレスを入力してください")
		.max(254, "メールアドレスが長すぎます"),
	subject: z.preprocess(
		emptyStringToNull,
		z.string().trim().max(200, "件名は200文字以内で入力してください").nullable().optional(),
	),
	message: z
		.string()
		.trim()
		.min(1, "本文を入力してください")
		.max(5000, "本文は5000文字以内で入力してください"),
	company_name: z.preprocess(
		emptyStringToNull,
		z.string().trim().max(200, "会社名は200文字以内で入力してください").nullable().optional(),
	),
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;
