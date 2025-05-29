import type { Database } from "@/types/supabase";
import type { z } from "zod";
import type { entrySchema, entryFormSchema } from "@/schemas/entries";

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
	relationship?: Relationship | null;
};

// 型の定義
export type CreateEntryInput = z.infer<typeof entrySchema>;
export type EntryFormValues = z.infer<typeof entryFormSchema>;

// 更新用の型定義
export type UpdateEntryInput = Partial<CreateEntryInput> & {
	id: string; // 更新時はIDが必須
	offeringEntries?: Array<Record<string, unknown>>;
};

// フォームの状態管理用の型
export interface EntryForm {
	name?: string; // 必須
	organization?: string | null;
	position?: string | null;
	amount?: number; // 必須
	postalCode?: string | null;
	address?: string | null;
	phoneNumber?: string | null;
	relationshipId?: string | null;
	attendanceType: AttendanceType; // 必須
	notes?: string | null;
}

// フォームデータ用のエントリー型
export type EditEntryFormData = {
	name: string; // 必須
	organization: string | null;
	position: string | null;
	amount: number; // 必須
	postalCode: string | null;
	address: string | null;
	phoneNumber: string | null;
	relationshipId: string | null;
	attendanceType: AttendanceType; // 必須
	notes: string | null;
	koudenId: string; // 必須
};

export type EntryResponse = Entry;

export interface OptimisticEntry extends Entry {
	isOptimistic: boolean;
	isDeleted?: boolean;
}

// PDF 用型定義
export interface KoudenEntry {
	id: string;
	name: string;
	organization: string;
	postalCode: string;
	address: string;
	relationship: string;
	amount: string;
	note?: string;
}

export interface KoudenData {
	title: string;
	entries: KoudenEntry[];
	total: string;
}
