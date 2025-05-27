/**
 * 返礼情報の型定義
 * @module return-records
 */

import type { Database } from "@/types/supabase";

/**
 * 返礼情報のステータス
 */
export type ReturnRecordStatus = "preparing" | "pending" | "completed";

/**
 * 返礼情報の基本型
 */
export interface ReturnRecordBase {
	/** 香典帳ID */
	kouden_id: string;
	/** 香典エントリーID */
	kouden_entry_id: string;
	/** 配送方法ID */
	kouden_delivery_method_id: string;
	/** ステータス */
	status: ReturnRecordStatus;
	/** 返礼手配日 */
	arrangement_date: string | null;
	/** 備考 */
	notes: string | null;
	/** 返礼方法ID */
	return_method_id: string;
}

/**
 * 返礼情報の型
 * @extends ReturnRecordBase
 */

/**
 * 返礼情報テーブルの型定義
 * @module return-records
 */

/** Supabase return_records Row型 */
export type ReturnRecord = Database["public"]["Tables"]["return_records"]["Row"];

/**
 * 返礼情報作成時の入力型
 */
export type CreateReturnRecordInput = Database["public"]["Tables"]["return_records"]["Insert"];

/**
 * 返礼情報更新時の入力型
 */
export type UpdateReturnRecordInput = Database["public"]["Tables"]["return_records"]["Update"];
