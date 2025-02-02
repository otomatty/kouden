import type { Database } from "@/types/supabase";

// 基本的な型定義
export type AttendanceType = "FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT";

export interface Relationship {
	id: string;
	name: string;
	description?: string;
}

// データベースの型定義を明示的に展開
export type Entry = Database["public"]["Tables"]["kouden_entries"]["Row"] & {
	attendanceType: AttendanceType;
	relationshipId: string | null;
};

// 型の定義
export type CreateEntryInput = z.infer<typeof entrySchema>;
export type EntryFormValues = z.infer<typeof entryFormSchema>;

export type UpdateEntryInput = Partial<CreateEntryInput> & {
	id?: string;
	offeringEntries?: Array<Record<string, unknown>>;
};

// フォームデータ用のエントリー型
export type EditEntryFormData = Omit<
	CreateEntryInput,
	"createdAt" | "updatedAt" | "createdBy" | "version" | "attendanceType"
> & {
	attendanceType: AttendanceType;
	hasOffering: boolean;
	isReturnCompleted: boolean;
	koudenId: string;
	relationshipId: string | null;
};

export type EntryResponse = Entry;

// フォームの状態管理用の型
export interface EntryForm {
	name: string | null;
	organization: string | null;
	position: string | null;
	amount: number;
	postalCode: string | null;
	address: string | null;
	phoneNumber: string | null;
	relationshipId: string | null;
	attendanceType: AttendanceType;
	hasOffering: boolean;
	isReturnCompleted: boolean;
	notes: string | null;
}

export interface OptimisticEntry extends Entry {
	isOptimistic: boolean;
	isDeleted?: boolean;
}
