/**
 * 返礼品マスター情報の型定義
 * @module return-items
 */

/**
 * 返礼品マスター情報の基本型
 */
export interface ReturnItemBase {
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
 * @extends ReturnItemBase
 */
export interface ReturnItem extends ReturnItemBase {
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
export type CreateReturnItemInput = ReturnItemBase;

/**
 * 返礼品マスター情報更新時の入力型
 */
export interface UpdateReturnItemInput {
	/** 返礼品ID */
	id: string;
	/** 返礼品名 */
	name?: string;
	/** 返礼品の説明 */
	description?: string | null;
	/** 返礼品の価格 */
	price?: number;
}
