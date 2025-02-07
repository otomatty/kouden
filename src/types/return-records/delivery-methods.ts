/**
 * 配送方法の型定義
 * @module delivery-methods
 */

/**
 * 配送方法の基本型
 */
export interface DeliveryMethodBase {
	/** 配送方法名 */
	name: string;
	/** 配送方法の説明 */
	description: string | null;
	/** システム定義の配送方法かどうか */
	is_system: boolean;
	/** 香典帳ID */
	kouden_id: string;
}

/**
 * 配送方法の型
 * @extends DeliveryMethodBase
 */
export interface DeliveryMethod extends DeliveryMethodBase {
	/** 配送方法ID */
	id: string;
	/** 作成日時 */
	created_at: string;
	/** 更新日時 */
	updated_at: string;
	/** 作成者ID */
	created_by: string;
}

/**
 * 配送方法作成時の入力型
 */
export type CreateDeliveryMethodInput = DeliveryMethodBase;

/**
 * 配送方法更新時の入力型
 */
export interface UpdateDeliveryMethodInput {
	/** 配送方法ID */
	id: string;
	/** 配送方法名 */
	name?: string;
	/** 配送方法の説明 */
	description?: string | null;
}
