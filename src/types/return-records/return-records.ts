/**
 * 返礼情報の型定義
 * @module return-records
 */

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
	/** 配送料金 */
	shipping_fee: number | null;
	/** 返礼予定日 */
	scheduled_date: string | null;
	/** 返礼完了日 */
	completed_date: string | null;
	/** 備考 */
	notes: string | null;
	/** 返礼品の合計金額 */
	total_amount: number;
}

/**
 * 返礼情報の型
 * @extends ReturnRecordBase
 */
export interface ReturnRecord extends ReturnRecordBase {
	/** 返礼情報ID */
	id: string;
	/** 作成日時 */
	created_at: string;
	/** 更新日時 */
	updated_at: string;
	/** 作成者ID */
	created_by: string;
}

/**
 * 返礼情報作成時の入力型
 */
export type CreateReturnRecordInput = Omit<ReturnRecordBase, "total_amount">;

/**
 * 返礼情報更新時の入力型
 */
export interface UpdateReturnRecordInput {
	/** 返礼情報ID */
	id: string;
	/** ステータス */
	status?: ReturnRecordStatus;
	/** 配送料金 */
	shipping_fee?: number | null;
	/** 返礼予定日 */
	scheduled_date?: string | null;
	/** 返礼完了日 */
	completed_date?: string | null;
	/** 備考 */
	notes?: string | null;
}
