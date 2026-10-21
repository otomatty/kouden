import type { Database } from "@/types/supabase";
import type { z } from "zod";
import type { telegramSchema, telegramFormSchema } from "@/schemas/telegram";

// データベースの型定義
export type TelegramRow = Database["public"]["Tables"]["telegrams"]["Row"];

// アプリケーションで使用する型
export interface Telegram {
	id: string;
	koudenId: string;
	koudenEntryId: string | null;
	senderName: string;
	senderOrganization: string | null;
	senderPosition: string | null;
	message: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	createdBy: string;
}

// 型の定義
export type CreateTelegramInput = z.infer<typeof telegramSchema>;
export type TelegramFormValues = z.infer<typeof telegramFormSchema>;

export type UpdateTelegramInput = Partial<CreateTelegramInput> & {
	id?: string;
};

// フォームデータ用の弔電型
export type EditTelegramFormData = Omit<
	CreateTelegramInput,
	"createdAt" | "updatedAt" | "createdBy" | "version"
> & {
	koudenId: string;
	koudenEntryId: string | null;
};

export type TelegramResponse = Telegram;

// フォームの状態管理用の型
export interface TelegramForm {
	senderName: string;
	senderOrganization: string | null;
	senderPosition: string | null;
	message: string | null;
	notes: string | null;
	koudenEntryId: string | null;
}

export interface OptimisticTelegram extends Telegram {
	isOptimistic: boolean;
	isDeleted?: boolean;
}
