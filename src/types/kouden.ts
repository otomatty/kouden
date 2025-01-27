import type { Database } from "./supabase";

export type Kouden = Database["public"]["Tables"]["koudens"]["Row"];

export type AttendanceType = "FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT";

export interface Relationship {
	id: string;
	name: string;
	description?: string;
}

// データベースの型定義
type DbKoudenEntry = Database["public"]["Tables"]["kouden_entries"]["Row"];
type DbKoudenEntryInsert =
	Database["public"]["Tables"]["kouden_entries"]["Insert"];

// データベースに保存されるエントリー（メタデータを含む）
export interface KoudenEntry extends Omit<DbKoudenEntry, "attendance_type"> {
	attendance_type: AttendanceType;
	relationship?: Relationship;
}

// フォームデータ用のエントリー型
export type EditKoudenEntryFormData = Omit<
	DbKoudenEntryInsert,
	"created_at" | "updated_at" | "created_by" | "version" | "attendance_type"
> & {
	attendance_type: AttendanceType;
	has_offering: boolean;
	is_return_completed: boolean;
	kouden_id: string;
	relationship_id: string | null;
};

export interface Offering {
	id: string;
	kouden_entry_id: string;
	type: "FLOWER" | "FOOD" | "OTHER";
	description: string | null;
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

// フォームの状態管理用の型
export interface KoudenEntryForm {
	name: string | null;
	organization: string | null;
	position: string | null;
	amount: number;
	postal_code: string | null;
	address: string | null;
	phone_number: string | null;
	relationship_id: string | null;
	attendance_type: AttendanceType;
	has_offering: boolean;
	is_return_completed: boolean;
	notes: string | null;
}
