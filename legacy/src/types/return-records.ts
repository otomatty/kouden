/**
 * 返礼品マスター
 */
export interface ReturnItem {
	id: string;
	name: string;
	description?: string;
	price: number;
	category: string;
	image_url?: string;
	is_active: boolean;
	recommended_amount_min: number;
	recommended_amount_max?: number;
	sort_order: number;
	kouden_id: string;
	created_at: string;
	updated_at: string;
	created_by: string;
}

/**
 * 返礼情報のステータス
 */
export type ReturnRecordStatus = "preparing" | "pending" | "completed";

/**
 * 返礼情報
 */
export interface ReturnRecord {
	id: string;
	kouden_id: string;
	kouden_entry_id: string;
	kouden_delivery_method_id: string;
	status: ReturnRecordStatus;
	shipping_fee: number | null;
	scheduled_date: string | null;
	completed_date: string | null;
	notes: string | null;
	total_amount: number;
	created_at: string;
	updated_at: string;
	created_by: string;
}

/**
 * 返礼品詳細
 */
export interface ReturnRecordItem {
	id: string;
	return_record_id: string;
	return_item_master_id: string;
	price: number;
	quantity: number;
	notes: string | null;
	created_at: string;
	updated_at: string;
	created_by: string;
}
