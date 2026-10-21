import { TEXT_MAX_LENGTH } from "@/config/constants";
import { z } from "zod";

/**
 * 電報（弔電）データの基本バリデーションスキーマ。
 * フォーム・作成・更新スキーマのベースとして利用する。
 */
export const telegramSchema = z.object({
	senderName: z
		.string()
		.min(1, "送信者名は必須です")
		.max(TEXT_MAX_LENGTH.SHORT, `送信者名は${TEXT_MAX_LENGTH.SHORT}文字以内で入力してください`),
	senderOrganization: z
		.string()
		.max(TEXT_MAX_LENGTH.SHORT, `所属組織は${TEXT_MAX_LENGTH.SHORT}文字以内で入力してください`)
		.nullable(),
	senderPosition: z
		.string()
		.max(TEXT_MAX_LENGTH.SHORT, `役職は${TEXT_MAX_LENGTH.SHORT}文字以内で入力してください`)
		.nullable(),
	message: z
		.string()
		.max(TEXT_MAX_LENGTH.LONG, `メッセージは${TEXT_MAX_LENGTH.LONG}文字以内で入力してください`)
		.nullable(),
	notes: z
		.string()
		.max(TEXT_MAX_LENGTH.LONG, `備考は${TEXT_MAX_LENGTH.LONG}文字以内で入力してください`)
		.nullable(),
	koudenEntryId: z.string().uuid("不正なIDです").nullable(),
});

/**
 * 電報フォーム送信時のバリデーションスキーマ。
 * 基本スキーマに香典帳ID（koudenId）を加えたもの。
 */
export const telegramFormSchema = telegramSchema.extend({
	koudenId: z.string().uuid("不正なIDです"),
});

/**
 * 電報作成API用のバリデーションスキーマ。
 * フォームスキーマに作成者ID（createdBy）を加えたもの。
 */
export const createTelegramSchema = telegramFormSchema.extend({
	createdBy: z.string().uuid("不正なIDです"),
});

/**
 * 電報更新API用のバリデーションスキーマ。
 * 更新時は各項目の部分更新を許可する。
 */
export const updateTelegramSchema = telegramSchema.partial().extend({
	id: z.string().uuid("不正なIDです"),
});
