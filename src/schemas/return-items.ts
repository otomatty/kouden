import { z } from "zod";

/**
 * 返礼品カテゴリスキーマ
 */
export const returnItemCategorySchema = z.enum([
	"FUNERAL_GIFT",
	"GIFT_CARD",
	"FOOD",
	"FLOWER",
	"OTHER",
]);

/**
 * 返礼品フォーム用の基本オブジェクトスキーマ
 */
const returnItemFormBaseSchema = z.object({
	name: z.string().min(1, "返礼品名は必須です").max(100, "返礼品名は100文字以内で入力してください"),
	description: z.string().max(500, "説明は500文字以内で入力してください").nullable().optional(),
	price: z
		.number()
		.min(0, "価格は0円以上で入力してください")
		.max(10000000, "価格は10,000,000円以下で入力してください"),
	category: returnItemCategorySchema.nullable().optional(),
	image_url: z.string().url("正しいURL形式で入力してください").optional().or(z.literal("")),
	is_active: z.boolean(),
	sort_order: z
		.number()
		.min(1, "表示順序は1以上で入力してください")
		.max(9999, "表示順序は9999以下で入力してください"),
	recommended_amount_min: z
		.number()
		.min(0, "推奨金額（最小）は0円以上で入力してください")
		.max(10000000, "推奨金額（最小）は10,000,000円以下で入力してください")
		.nullable()
		.optional(),
	recommended_amount_max: z
		.number()
		.min(0, "推奨金額（最大）は0円以上で入力してください")
		.max(10000000, "推奨金額（最大）は10,000,000円以下で入力してください")
		.nullable()
		.optional(),
});

/**
 * 返礼品フォーム用のバリデーションスキーマ
 * フォームで入力される値をバリデーション
 */
export const returnItemFormSchema = returnItemFormBaseSchema.refine(
	(data) => {
		// 推奨金額の最小値と最大値の関係をチェック
		if (data.recommended_amount_min && data.recommended_amount_max) {
			return data.recommended_amount_min <= data.recommended_amount_max;
		}
		return true;
	},
	{
		message: "推奨金額（最大）は最小値以上で入力してください",
		path: ["recommended_amount_max"],
	},
);

/**
 * 返礼品作成用スキーマ
 */
export const createReturnItemSchema = returnItemFormBaseSchema.extend({
	kouden_id: z.string().uuid("香典帳IDが不正です"),
});

/**
 * 返礼品更新用スキーマ
 */
export const updateReturnItemSchema = returnItemFormBaseSchema.extend({
	id: z.string().uuid("返礼品IDが不正です"),
	kouden_id: z.string().uuid("香典帳IDが不正です"),
});

// 型エクスポート
export type ReturnItemFormData = z.infer<typeof returnItemFormSchema>;
export type CreateReturnItemData = z.infer<typeof createReturnItemSchema>;
export type UpdateReturnItemData = z.infer<typeof updateReturnItemSchema>;

// 旧スキーマ（互換性のため残しておく）
export const returnItemSchema = z.object({
	kouden_entry_id: z.string().uuid(),
	name: z.string().min(1, "品名を入力してください"),
	price: z.number().min(1, "価格を入力してください"),
	delivery_method: z.enum(["MAIL", "HAND", "DELIVERY", "OTHER"]).default("MAIL"),
	sent_date: z.string().optional(),
	notes: z.string().nullish(),
});
