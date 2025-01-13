export type AttendanceType = "FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT";

export interface KoudenEntryTableData {
	id: string;
	kouden_id: string;

	// 基本情報
	name?: string | null;
	organization?: string | null;
	position?: string | null;
	amount: number;
	postal_code?: string | null;
	address: string;
	phone_number?: string | null;
	relationship_id?: string | null;
	relationship?: {
		id: string;
		name: string;
		description?: string;
	} | null;

	// 参列情報
	attendance_type: AttendanceType;
	has_offering: boolean;
	is_return_completed: boolean;

	// その他
	notes?: string | null;
	created_at: string;
	updated_at: string;
}

export interface EditKoudenEntryFormData {
	name?: string;
	organization?: string;
	position?: string;
	amount: number;
	postal_code?: string;
	address: string;
	phone_number?: string;
	relationship_id?: string;
	attendance_type: AttendanceType;
	has_offering: boolean;
	is_return_completed: boolean;
	notes?: string;
}

export interface KoudenEntryTableProps {
	entries: KoudenEntryTableData[];
	koudenId: string;
	updateKoudenEntry: (
		id: string,
		data: EditKoudenEntryFormData,
	) => Promise<KoudenEntryTableData>;
	createKoudenEntry: (
		data: EditKoudenEntryFormData & { kouden_id: string },
	) => Promise<KoudenEntryTableData>;
	deleteKoudenEntries: (ids: string[]) => Promise<void>;
}
