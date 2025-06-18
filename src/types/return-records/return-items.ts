/**
 * 返礼品マスター情報の型定義
 * @module return-items
 */

// スキーマから生成される型をre-export
export type {
	ReturnItemFormData,
	CreateReturnItemData,
	UpdateReturnItemData,
} from "@/schemas/return-items";

/**
 * 返礼品カテゴリの型定義
 */
export type ReturnItemCategory =
	| "FUNERAL_GIFT" // 会葬品
	| "GIFT_CARD" // ギフト券
	| "FOOD" // 食品
	| "FLOWER" // 花
	| "OTHER"; // その他

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
	/** 返礼品カテゴリ */
	category?: ReturnItemCategory | null;
	/** 返礼品の画像URL */
	image_url?: string | null;
	/** 選択可能かどうか */
	is_active?: boolean;
	/** 表示順序（昇順） */
	sort_order?: number;
	/** 推奨香典金額の最小値（円） */
	recommended_amount_min?: number | null;
	/** 推奨香典金額の最大値（円、NULLの場合は上限なし） */
	recommended_amount_max?: number | null;
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
	/** 返礼品カテゴリ */
	category: ReturnItemCategory | null;
	/** 返礼品の画像URL */
	image_url: string | null;
	/** 選択可能かどうか */
	is_active: boolean;
	/** 表示順序（昇順） */
	sort_order: number;
	/** 推奨香典金額の最小値（円） */
	recommended_amount_min: number | null;
	/** 推奨香典金額の最大値（円、NULLの場合は上限なし） */
	recommended_amount_max: number | null;
}

/**
 * 返礼品マスター情報作成時の入力型
 * @deprecated CreateReturnItemDataを使用してください
 */
export type CreateReturnItemInput = ReturnItemBase;

/**
 * 返礼品マスター情報更新時の入力型
 * @deprecated UpdateReturnItemDataを使用してください
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
	/** 返礼品カテゴリ */
	category?: ReturnItemCategory | null;
	/** 返礼品の画像URL */
	image_url?: string | null;
	/** 選択可能かどうか */
	is_active?: boolean;
	/** 表示順序（昇順） */
	sort_order?: number;
	/** 推奨香典金額の最小値（円） */
	recommended_amount_min?: number | null;
	/** 推奨香典金額の最大値（円、NULLの場合は上限なし） */
	recommended_amount_max?: number | null;
}
