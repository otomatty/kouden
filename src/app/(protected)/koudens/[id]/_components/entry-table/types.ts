import type { Offering as BaseOffering } from "@/types/offering";

export type AttendanceType = "FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT";

export interface Offering extends BaseOffering {
	kouden_entry_id: string | null;
	offering_photos: never[];
}

export interface ReturnItem {
	id: string;
	kouden_entry_id: string;
	name: string;
	price: number;
	delivery_method: string;
	sent_date: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
	created_by: string;
}

export interface Relationship {
	id: string;
	kouden_id: string;
	name: string;
	description: string | null;
	is_default: boolean;
	created_at: string;
	updated_at: string;
	created_by: string;
}

export interface KoudenEntryTableData {
	id: string;
	kouden_id: string;
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
	created_at: string;
	updated_at: string;
	created_by: string;
	version: number | null;
	last_modified_at: string | null;
	last_modified_by: string | null;
	// リレーションシップ
	relationship?: Relationship | null;
	offerings?: Offering[];
	return_items?: ReturnItem[];
}

export interface EditKoudenEntryFormData {
	kouden_id?: string;
	name?: string | null;
	organization?: string | null;
	position?: string | null;
	amount?: number;
	postal_code?: string | null;
	address?: string | null;
	phone_number?: string | null;
	relationship_id?: string | null;
	attendance_type?: AttendanceType | null;
	has_offering?: boolean;
	is_return_completed?: boolean;
	notes?: string | null;
}

export interface KoudenEntryTableProps {
	entries: KoudenEntryTableData[];
	koudenId: string;
	updateKoudenEntry: (
		id: string,
		data: EditKoudenEntryFormData,
	) => Promise<KoudenEntryTableData>;
	createKoudenEntry: (
		data: EditKoudenEntryFormData & {
			kouden_id: string;
		},
	) => Promise<KoudenEntryTableData>;
	deleteKoudenEntries: (ids: string[]) => Promise<void>;
}
