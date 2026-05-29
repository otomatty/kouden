import { TEXT_MAX_LENGTH } from "@/config/constants";
import { z } from "zod";

// 基本的なバリデーションルール
export const telegramSchema = z.object({
	senderName: z
		.string()
		.min(1, "送信者名は必須です")
		.max(TEXT_MAX_LENGTH.SHORT, "送信者名は100文字以内で入力してください"),
	senderOrganization: z
		.string()
		.max(TEXT_MAX_LENGTH.SHORT, "所属組織は100文字以内で入力してください")
		.nullable(),
	senderPosition: z
		.string()
		.max(TEXT_MAX_LENGTH.SHORT, "役職は100文字以内で入力してください")
		.nullable(),
	message: z
		.string()
		.max(TEXT_MAX_LENGTH.LONG, "メッセージは1000文字以内で入力してください")
		.nullable(),
	notes: z.string().max(TEXT_MAX_LENGTH.LONG, "備考は1000文字以内で入力してください").nullable(),
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
