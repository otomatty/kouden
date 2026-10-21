import type { Database } from "@/types/supabase";
import type { z } from "zod";
import type { entrySchema, entryFormSchema } from "@/schemas/entries";

// 基本的な型定義
export type AttendanceType = "FUNERAL" | "CONDOLENCE_VISIT" | "ABSENT";

// 参列種別の日本語マッピング
export const attendanceTypeMap: Record<AttendanceType, string> = {
	FUNERAL: "葬儀",
	CONDOLENCE_VISIT: "弔問",
	ABSENT: "香典のみ",
} as const;

// 参列種別の色定義（統計グラフ用）
export const attendanceTypeColors: Record<AttendanceType, string> = {
	FUNERAL: "#2563eb", // 青
	CONDOLENCE_VISIT: "#16a34a", // 緑
	ABSENT: "#dc2626", // 赤
} as const;

export interface Relationship {
	id: string;
	name: string;
	description?: string;
}

// 返礼状況の型定義
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
	// 返礼管理の情報（return_entry_recordsテーブルから取得）
	returnStatus?: ReturnStatus;
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

// 改善された返礼品管理のための型定義
export interface ImprovedReturnManagement {
	// 基本情報
	kouden_entry_id: string;
	primary_recipient: boolean; // メイン受取人かどうか

	// 新しいお供物配分情報（実装済み）
	offering_allocations?: OfferingAllocation[];

	// 返礼品共有情報（将来実装）
	shared_return?: {
		group_id: string; // 共有グループID
		is_representative: boolean; // 代表者かどうか
		shared_members: string[]; // 共有メンバーのkouden_entry_ids
	};
}

// お供物の改善された関連付け型（実装済み）
export interface OfferingAllocation {
	id: string;
	offering_id: string | null;
	kouden_entry_id: string | null;
	allocated_amount: number; // 配分金額（固定値）
	allocation_ratio: number; // 配分比率（0.0-1.0）
	is_primary_contributor: boolean | null; // 主要提供者かどうか
	contribution_notes: string | null;
	created_at: string | null;
	updated_at: string | null;
	created_by: string | null;
}

// 返礼管理の新しい総合型定義
export interface EnhancedReturnManagement extends ReturnManagementEntry {
	// 配分されたお供物情報
	offering_allocations: OfferingAllocation[];

	// 計算された合計金額（香典 + 配分されたお供物）
	calculated_total_amount: number;

	// 返礼品情報
	return_calculation: {
		base_amount: number; // 基本返礼金額
		offering_portion: number; // お供物分の返礼金額
		total_return_value: number; // 総返礼価値
		recommended_items: ReturnItem[]; // 推奨返礼品
	};
}

// お供物配分のための型定義
export interface OfferingAllocationRequest {
	offering_id: string;
	kouden_entry_ids: string[];
	allocation_method: "equal" | "weighted" | "manual";
	manual_amounts?: number[]; // manual の場合のみ
	primary_contributor_id?: string; // 主要提供者を指定
}
