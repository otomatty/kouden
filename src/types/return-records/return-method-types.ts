/**
 * 返礼方法種別の型定義
 * @module return-method-types
 */

/**
 * 返礼方法種別の基本型
 */
export interface ReturnMethodTypeBase {
	/** 返礼方法名 */
	name: string;
	/** 返礼方法の説明 */
	description: string | null;
	/** 項目必須フラグ */
	is_item_required: boolean;
	/** 表示順 */
	sort_order: number | null;
}

/**
 * 返礼方法種別の型
 * @extends ReturnMethodTypeBase
 */
export interface ReturnMethodType extends ReturnMethodTypeBase {
	/** 返礼方法種別ID */
	id: string;
	/** 作成日時 */
	created_at: string;
	/** 更新日時 */
	updated_at: string;
}

/**
 * 返礼方法種別作成時の入力型
 */
export type CreateReturnMethodTypeInput = ReturnMethodTypeBase;

/**
 * 返礼方法種別更新時の入力型
 */
export interface UpdateReturnMethodTypeInput {
	/** 返礼方法種別ID */
	id: string;
	/** 返礼方法名 */
	name?: string;
	/** 返礼方法の説明 */
	description?: string | null;
	/** 項目必須フラグ */
	is_item_required?: boolean;
	/** 表示順 */
	sort_order?: number | null;
}
