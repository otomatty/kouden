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

// 返礼ステータスの型定義
export type ReturnStatus = "PENDING" | "PARTIAL_RETURNED" | "COMPLETED" | "NOT_REQUIRED";

// 返礼品アイテムの型定義
export interface ReturnItem {
	name: string;
	price: number;
	quantity: number;
	notes?: string;
}

// データベースの型定義を明示的に展開
export type Entry = Database["public"]["Tables"]["kouden_entries"]["Row"] & {
	attendanceType: AttendanceType;
	relationshipId: string | null;
	relationship?: Relationship | null;
	// 返礼管理の情報（return_management_summaryビューから取得）
	return_status?: ReturnStatus;
	status_display?: string;
	needs_additional_return?: boolean;
	// 後方互換性のために残しつつ、新しいreturn_statusから計算
	is_return_completed?: boolean;
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

// 返礼管理サマリーの型定義
export interface ReturnManagementEntry {
	kouden_id: string;
	kouden_entry_id: string;
	name: string | null;
	organization: string | null;
	position: string | null;
	relationship_name: string | null;
	kouden_amount: number | null;
	offering_count: number | null;
	offering_total: number | null;
	total_amount: number | null;
	return_status: ReturnStatus | null;
	funeral_gift_amount: number | null;
	additional_return_amount: number | null;
	return_method: string | null;
	return_items: ReturnItem[] | null; // JSON型
	arrangement_date: string | null;
	remarks: string | null;
	status_display: string | null;
	needs_additional_return: boolean | null;
}
