import { z } from "zod";
import type { Database } from "./supabase";

// データベースの型定義
export type Kouden = Database["public"]["Tables"]["koudens"]["Row"];

/**
 * 香典帳取得 API が返すオーナー情報。
 * profiles テーブルから id と display_name のみを SELECT した結果に対応する。
 */
export interface KoudenOwnerInfo {
	id: string;
	display_name: string | null;
}

/**
 * オーナー情報を含む香典帳。
 * `getKouden` / `createKouden` / `duplicateKouden` などが返す形。
 */
export interface KoudenWithOwner extends Kouden {
	owner: KoudenOwnerInfo;
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
