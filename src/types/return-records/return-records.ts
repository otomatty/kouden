/**
 * 返礼情報の型定義
 * @module return-records
 */

import type { Database } from "@/types/supabase";
import type { AttendanceType } from "@/types/entries";

/**
 * 返礼状況の型定義
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
 * 返礼エントリーレコードとkouden_entriesをjoinした型定義
 */
export interface ReturnEntryRecordWithKoudenEntry extends ReturnEntryRecord {
	kouden_entries: {
		kouden_id: string;
		name: string;
		organization: string | null;
		position: string | null;
		amount: number | null;
	};
}

/**
 * 返礼エントリーレコード作成時の入力型
 */
export interface CreateReturnEntryInput {
	/** 香典エントリーID */
	kouden_entry_id: string;
	/** 返礼状況 */
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
	/** 返礼状況 */
	return_status?: ReturnStatus;
	/** 返礼品リスト（JSON） */
	return_items?: ReturnItem[];
	/** 返礼方法 */
	return_method?: string | null;
	/** 手配日 */
	arrangement_date?: string | null;
	/** 葬儀ギフト金額 */
	funeral_gift_amount?: number;
	// additional_return_amount は生成カラムのため更新対象外
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

/**
 * 一括変更の条件設定
 */
export interface BulkUpdateFilters {
	/** 金額範囲 */
	amountRange?: {
		min?: number;
		max?: number;
	};
	/** 関係性ID */
	relationshipIds?: string[];
	/** 現在のステータス */
	currentStatuses?: ReturnStatus[];
	/** 参列タイプ */
	attendanceTypes?: AttendanceType[];
	/** お供物の有無 */
	hasOffering?: boolean;
}

/**
 * 一括変更の更新内容
 */
export interface BulkUpdateChanges {
	/** 返礼品の操作 */
	returnItems?: {
		action: "add" | "replace" | "clear";
		items: ReturnItem[];
	};
	/** ステータス変更 */
	status?: ReturnStatus;
	/** 返礼方法 */
	returnMethod?: string;
	/** 手配日 */
	arrangementDate?: Date;
	/** 備考 */
	remarks?: string;
}

/**
 * 一括変更の設定
 */
export interface BulkUpdateConfig {
	/** 条件設定 */
	filters: BulkUpdateFilters;
	/** 変更内容 */
	updates: BulkUpdateChanges;
}

/**
 * 一括変更のプレビュー結果
 */
export interface BulkUpdatePreview {
	/** 対象件数 */
	targetCount: number;
	/** 対象の総金額 */
	totalAmount: number;
	/** 対象レコードのサンプル */
	sampleRecords: ReturnManagementSummary[];
	/** 変更内容のサマリー */
	changesSummary: string[];
}
