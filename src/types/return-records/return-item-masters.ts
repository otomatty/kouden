/**
 * 返礼品マスター情報の型定義
 * @module return-item-masters
 */

/**
 * 返礼品マスター情報の基本型
 */
export interface ReturnItemMasterBase {
	/** 返礼品名 */
	name: string;
	/** 返礼品の説明 */
	description: string | null;
	/** 返礼品の価格 */
	price: number;
	/** 香典帳ID */
	kouden_id: string;
}

/**
 * 返礼品マスター情報の型
 * @extends ReturnItemMasterBase
 */
export interface ReturnItemMaster extends ReturnItemMasterBase {
	/** 返礼品マスターID */
	id: string;
	/** 作成日時 */
	created_at: string;
	/** 更新日時 */
	updated_at: string;
	/** 作成者ID */
	created_by: string;
}

/**
 * 返礼品マスター情報作成時の入力型
 */
export type CreateReturnItemMasterInput = ReturnItemMasterBase;

/**
 * 返礼品マスター情報更新時の入力型
 */
export interface UpdateReturnItemMasterInput {
	/** 返礼品マスターID */
	id: string;
	/** 返礼品名 */
	name?: string;
	/** 返礼品の説明 */
	description?: string | null;
	/** 返礼品の価格 */
	price?: number;
}
