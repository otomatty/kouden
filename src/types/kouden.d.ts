import { z } from "zod";
import type { Database } from "./supabase";
import type { Profile } from "./profile";

// データベースの型定義
export type Kouden = Database["public"]["Tables"]["koudens"]["Row"];

// アプリケーション内で使用する型定義
export interface KoudenExtended extends Omit<KoudenRow, "owner_id" | "created_by"> {
	owner: Profile;
	created_by: Profile;
}

// パラメータの型定義
export interface GetKoudensParams {
	userId: string;
}

export interface CreateKoudenParams {
	title: string;
	description?: string;
	userId: string;
}

// Zodスキーマ定義
export const koudenSchema = z.object({
	title: z.string().min(1, "香典帳のタイトルを入力してください"),
	description: z.string().optional(),
});

export type CreateKoudenInput = z.infer<typeof koudenSchema>;

// 香典帳のステータス
export const KOUDEN_STATUS = {
	ACTIVE: "active",
	ARCHIVED: "archived",
} as const;

export type KoudenStatus = (typeof KOUDEN_STATUS)[keyof typeof KOUDEN_STATUS];
