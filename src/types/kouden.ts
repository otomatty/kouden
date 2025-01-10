import type { MemberRole } from "./sharing";
import type { Database } from "./supabase";

export interface Kouden {
	id: string;
	title: string;
	description?: string | null;
	created_at: string;
	updated_at: string;
	created_by: string;
	owner_id: string;
	shared_user_ids: string[];
	status: "active" | "archived";
	// 関連情報
	owner?: {
		display_name: string;
	};
}

export type KoudenEntry =
	Database["public"]["Tables"]["kouden_entries"]["Row"] & {
		offerings?: Database["public"]["Tables"]["offerings"]["Row"][];
		return_items?: Database["public"]["Tables"]["return_items"]["Row"][];
		relationship_id?: string | null;
	};

export interface Offering {
	id: string;
	kouden_entry_id: string;
	type: "FLOWER" | "FOOD" | "OTHER";
	description: string;
	price?: number | null;
	notes?: string | null;
	created_at: string;
	updated_at: string;
	created_by: string;
}

export interface ReturnItem {
	id: string;
	kouden_entry_id: string;
	name: string;
	price: number;
	delivery_method: "shipping" | "hand_delivery";
	sent_date?: string | null;
	notes?: string | null;
	created_at: string;
	updated_at: string;
	created_by: string;
}

// パラメータの型定義
export interface GetKoudensParams {
	userId: string;
}

export interface CreateKoudenParams {
	title: string;
	description?: string;
	userId: string;
}
