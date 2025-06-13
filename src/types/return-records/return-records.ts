/**
 * 返礼情報の型定義
 * @module return-records
 */

import type { Database } from "@/types/supabase";

/**
 * 返礼ステータスの型定義
 */
export type ReturnStatus = "PENDING" | "PARTIAL_RETURNED" | "COMPLETED" | "NOT_REQUIRED";

/**
 * 返礼品アイテムの型定義
 */
export interface ReturnItem {
	name: string;
	price: number;
	quantity: number;
	notes?: string;
}

/**
 * 返礼エントリーレコードの型定義（Supabaseテーブルから取得）
 */
export type ReturnEntryRecord = Database["public"]["Tables"]["return_entry_records"]["Row"];

/**
 * 返礼エントリーレコード作成時の入力型
 */
export interface CreateReturnEntryInput {
	/** 香典エントリーID */
	kouden_entry_id: string;
	/** 返礼ステータス */
	return_status?: ReturnStatus;
	/** 返礼品リスト（JSON） */
	return_items?: ReturnItem[];
	/** 葬儀日 */
	funeral_date?: string | null;
	/** 備考 */
	notes?: string | null;
}

/**
 * 返礼エントリーレコード更新時の入力型
 */
export interface UpdateReturnEntryInput {
	/** 香典エントリーID */
	kouden_entry_id: string;
	/** 返礼ステータス */
	return_status?: ReturnStatus;
	/** 返礼品リスト（JSON） */
	return_items?: ReturnItem[];
	/** 返礼方法 */
	return_method?: string | null;
	/** 手配日 */
	arrangement_date?: string | null;
	/** 葬儀ギフト金額 */
	funeral_gift_amount?: number;
	/** 追加返礼金額 */
	additional_return_amount?: number | null;
	/** 備考 */
	remarks?: string | null;
}

/**
 * 返礼管理サマリーの型定義（ビューから取得）
 */
export interface ReturnManagementSummary {
	kouden_id: string;
	kouden_entry_id: string;
	entry_name: string;
	organization: string;
	entry_position: string;
	relationship_name: string;
	kouden_amount: number;
	offering_count: number;
	offering_total: number;
	total_amount: number;
	return_status: ReturnStatus;
	funeral_gift_amount: number;
	additional_return_amount: number;
	return_method: string;
	return_items: ReturnItem[];
	arrangement_date: string;
	remarks: string;
	return_record_created: string;
	return_record_updated: string;
	status_display: string;
	needs_additional_return: boolean;
}
