/**
 * 返礼品詳細情報の型定義
 * @module return-record-items
 */

/**
 * 返礼品詳細情報の基本型
 */
export interface ReturnRecordItemBase {
	/** 返礼情報ID */
	return_record_id: string;
	/** 返礼品マスターID */
	return_item_master_id: string;
	/** 返礼品の価格 */
	price: number;
	/** 数量 */
	quantity: number;
	/** 備考 */
	notes: string | null;
}

/**
 * 返礼品詳細情報の型
 * @extends ReturnRecordItemBase
 */
export interface ReturnRecordItem extends ReturnRecordItemBase {
	/** 返礼品詳細情報ID */
	id: string;
	/** 作成日時 */
	created_at: string;
	/** 更新日時 */
	updated_at: string;
	/** 作成者ID */
	created_by: string;
}

/**
 * 返礼品詳細情報作成時の入力型
 */
export type CreateReturnRecordItemInput = ReturnRecordItemBase;

/**
 * 返礼品詳細情報更新時の入力型
 */
export interface UpdateReturnRecordItemInput {
	/** 返礼品詳細情報ID */
	id: string;
	/** 返礼品の価格 */
	price?: number;
	/** 数量 */
	quantity?: number;
	/** 備考 */
	notes?: string | null;
}
