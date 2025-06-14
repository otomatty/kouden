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
	return_status: ReturnStatus;
	/** 返礼品リスト（JSON） */
	return_items?: ReturnItem[];
	/** 葬儀日 */
	funeral_date?: string | null;
	/** 備考 */
	remarks?: string | null;
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
	koudenId: string;
	koudenEntryId: string;
	entryName: string;
	organization: string;
	entryPosition: string;
	relationshipName: string;
	koudenAmount: number;
	offeringCount: number;
	offeringTotal: number;
	totalAmount: number;
	returnStatus: ReturnStatus;
	funeralGiftAmount: number;
	additionalReturnAmount: number;
	returnMethod: string;
	returnItems: ReturnItem[];
	arrangementDate: string;
	remarks: string;
	returnRecordCreated: string;
	returnRecordUpdated: string;
	statusDisplay: string;
	needsAdditionalReturn: boolean;
	// 新規追加: 発送先情報
	shippingPostalCode?: string;
	shippingAddress?: string;
	shippingPhoneNumber?: string;
	// 新規追加: コスト情報
	returnItemsCost: number;
	profitLoss: number;
}
