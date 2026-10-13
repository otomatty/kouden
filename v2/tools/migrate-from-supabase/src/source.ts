/**
 * 旧アプリ（Supabase）の行の形。抽出（extract）がこの形で読み、変換（transform）が新しい形にする。
 * 列名は Supabase のまま（src/types/supabase.d.ts の Row）。使う列だけを持つ
 */

export interface LegacyAuthUser {
	id: string;
	email: string | null;
	created_at: string;
	/** auth.identities。Google の provider_id は Google の sub */
	identities: { provider: string; provider_id: string }[];
}

export interface LegacyProfile {
	id: string;
	display_name: string | null;
}

export interface LegacyKouden {
	id: string;
	title: string;
	description?: string | null;
	owner_id: string;
	status: string;
	created_at: string;
	updated_at: string;
}

export interface LegacyRole {
	id: string;
	permissions: string[];
}

export interface LegacyMember {
	user_id: string;
	role_id: string;
	added_by: string | null;
	created_at: string;
}

export interface LegacyPurchase {
	id: string;
	user_id: string;
	amount_paid: number;
	stripe_session_id: string | null;
	purchased_at: string;
}

export interface LegacyRelationship {
	id: string;
	name: string;
	description?: string | null;
	is_enabled: boolean;
	created_at: string;
}

interface Audited {
	created_by: string;
	created_at: string;
	updated_at: string;
}

export interface LegacyEntry extends Audited {
	id: string;
	name: string | null;
	organization: string | null;
	position: string | null;
	amount: number;
	postal_code: string | null;
	address: string | null;
	phone_number: string | null;
	relationship_id: string | null;
	attendance_type: string;
	notes: string | null;
	last_modified_by: string | null;
	/**
	 * 旧アプリの古い形式の「返礼済み」の印。香典返しの記録（return_entry_records）がなければ、旧画面はこの印で判定していた。
	 * 本番のスキーマから列が消えていることもあるので任意
	 */
	is_return_completed?: boolean | null;
}

export interface LegacyOffering extends Audited {
	id: string;
	type: string;
	description: string | null;
	quantity: number;
	price: number | null;
	provider_name: string;
	notes: string | null;
}

export interface LegacyOfferingAllocation {
	offering_id: string | null;
	kouden_entry_id: string | null;
	allocated_amount: number;
	is_primary_contributor: boolean | null;
	contribution_notes?: string | null;
	created_at: string | null;
}

export interface LegacyOfferingEntry {
	offering_id: string;
	kouden_entry_id: string;
	created_at: string;
}

export interface LegacyTelegram extends Audited {
	id: string;
	kouden_entry_id: string | null;
	sender_name: string;
	sender_organization: string | null;
	sender_position: string | null;
	message: string | null;
	notes: string | null;
}

export interface LegacyReturnItem {
	id: string;
	name: string;
	category: string | null;
	price: number;
	description: string | null;
	image_url: string | null;
	is_active: boolean | null;
	sort_order: number | null;
	recommended_amount_min: number | null;
	recommended_amount_max: number | null;
	created_at: string;
	updated_at: string;
}

export interface LegacyReturnRecord extends Audited {
	id: string;
	kouden_entry_id: string;
	return_status: string;
	return_method: string | null;
	funeral_gift_amount: number;
	arrangement_date: string | null;
	shipping_postal_code: string | null;
	shipping_address: string | null;
	shipping_phone_number: string | null;
	remarks: string | null;
	return_items: unknown;
}

export interface LegacyReturnRecordItem {
	id: string;
	return_record_id: string;
	return_item_master_id: string;
	price: number;
	quantity: number;
	notes?: string | null;
}

/** 香典帳 1 冊分の旧データ（抽出の単位） */
export interface LegacyKoudenSource {
	kouden: LegacyKouden;
	roles: LegacyRole[];
	members: LegacyMember[];
	purchases: LegacyPurchase[];
	relationships: LegacyRelationship[];
	entries: LegacyEntry[];
	offerings: LegacyOffering[];
	offeringAllocations: LegacyOfferingAllocation[];
	offeringEntries: LegacyOfferingEntry[];
	telegrams: LegacyTelegram[];
	returnItems: LegacyReturnItem[];
	returnRecords: LegacyReturnRecord[];
	returnRecordItems: LegacyReturnRecordItem[];
}
