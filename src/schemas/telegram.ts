import { z } from "zod";

// 基本的なバリデーションルール
export const telegramSchema = z.object({
	senderName: z
		.string()
		.min(1, "送信者名は必須です")
		.max(100, "送信者名は100文字以内で入力してください"),
	senderOrganization: z.string().max(100, "所属組織は100文字以内で入力してください").nullable(),
	senderPosition: z.string().max(100, "役職は100文字以内で入力してください").nullable(),
	message: z.string().max(1000, "メッセージは1000文字以内で入力してください").nullable(),
	notes: z.string().max(1000, "備考は1000文字以内で入力してください").nullable(),
	koudenEntryId: z.string().uuid("不正なIDです").nullable(),
});

// フォーム用のスキーマ
export const telegramFormSchema = telegramSchema.extend({
	koudenId: z.string().uuid("不正なIDです"),
});

// 作成用のスキーマ
export const createTelegramSchema = telegramFormSchema.extend({
	createdBy: z.string().uuid("不正なIDです"),
});

// 更新用のスキーマ
export const updateTelegramSchema = telegramSchema.partial().extend({
	id: z.string().uuid("不正なIDです"),
});
