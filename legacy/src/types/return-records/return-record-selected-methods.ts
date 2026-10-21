/**
 * 返礼情報選択返礼方法の型定義
 * @module return-record-selected-methods
 */

/**
 * 返礼情報選択返礼方法の基本型
 */
export interface ReturnRecordSelectedMethodBase {
	/** 返礼情報ID */
	return_record_id: string;
	/** 返礼方法種別ID */
	return_method_type_id: string;
}

/**
 * 返礼情報選択返礼方法の型
 * @extends ReturnRecordSelectedMethodBase
 */
export interface ReturnRecordSelectedMethod extends ReturnRecordSelectedMethodBase {
	/** 選択ID */
	id: string;
	/** 作成日時 */
	created_at: string;
	/** 更新日時 */
	updated_at: string;
}

/**
 * 返礼情報選択返礼方法作成時の入力型
 */
export type CreateReturnRecordSelectedMethodInput = ReturnRecordSelectedMethodBase;

/**
 * 返礼情報選択返礼方法更新時の入力型
 */
export interface UpdateReturnRecordSelectedMethodInput {
	/** 選択ID */
	id: string;
	/** 返礼方法種別ID */
	return_method_type_id?: string;
}
