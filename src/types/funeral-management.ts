/**
 * 葬儀管理システムの型定義
 * Supabaseの自動生成型に基づく正しい型定義
 */

import type { Database } from "./supabase";

// 結合された顧客型（表示用）
export interface Customer {
	// 基本情報（common.customers）
	id: string;
	name: string;
	email: string;
	phone: string | null;
	organization_id: string;
	created_at: string;
	updated_at: string | null;

	// 詳細情報（funeral.customer_details）
	details?: {
		id: string;
		customer_id: string;
		address: string | null;
		religion: string | null;
		allergy: string | null;
		registration_date: string | null;
		last_contact_date: string | null;
		notes: string | null;
		status: string;
		details_created_at: string;
		details_updated_at: string | null;
	};
}

// 新規顧客作成用の型
export interface CreateCustomerInput {
	// 基本情報
	name: string;
	email: string;
	phone?: string;
	organization_id: string;

	// 詳細情報（オプション）
	address?: string;
	religion?: string;
	allergy?: string;
	registration_date?: string;
	last_contact_date?: string;
	notes?: string;
	status?: CustomerStatus;
}

// 顧客更新用の型
export interface UpdateCustomerInput {
	// 基本情報
	id: string;
	name?: string;
	email?: string;
	phone?: string;

	// 詳細情報
	address?: string;
	religion?: string;
	allergy?: string;
	registration_date?: string;
	last_contact_date?: string;
	notes?: string;
	status?: CustomerStatus;
}

export type CustomerStatus = "アクティブ" | "案件進行中" | "フォロー中" | "完了";

// 葬儀案件関連（正しいデータベース構造に基づく）
export interface FuneralCaseWithDetails {
	id: string;
	customer_id: string;
	deceased_name: string;
	venue: string | null;
	start_datetime: string | null;
	status: string | null;
	organization_id: string;
	created_at: string;
	updated_at: string | null;

	// 関連情報（結合時に取得）
	customer?: Customer;
	assigned_staff?: string; // これは別途staffテーブルから取得
	budget?: number; // これは見積りテーブルから計算
}

export type CaseStatus = "準備中" | "施行中" | "完了" | "要注意";

// 新規案件作成用
export interface CreateFuneralCaseInput {
	customer_id: string;
	deceased_name: string;
	venue?: string;
	start_datetime?: string;
	status?: CaseStatus;
	organization_id: string;
}

// 案件更新用
export interface UpdateFuneralCaseInput {
	id: string;
	customer_id?: string;
	deceased_name?: string;
	venue?: string;
	start_datetime?: string;
	status?: CaseStatus;
}

// 参列者関連
export type Attendee = Database["funeral"]["Tables"]["attendees"]["Row"];
export type AttendeeInsert = Database["funeral"]["Tables"]["attendees"]["Insert"];
export type AttendeeUpdate = Database["funeral"]["Tables"]["attendees"]["Update"];
export type AttendeeStatus = "出席" | "欠席" | "未確認";

// 香典受付記録関連
export type Donation = Database["funeral"]["Tables"]["donations"]["Row"];
export type DonationInsert = Database["funeral"]["Tables"]["donations"]["Insert"];
export type DonationUpdate = Database["funeral"]["Tables"]["donations"]["Update"];

// 見積関連
export type Quote = Database["funeral"]["Tables"]["quotes"]["Row"];
export type QuoteInsert = Database["funeral"]["Tables"]["quotes"]["Insert"];
export type QuoteUpdate = Database["funeral"]["Tables"]["quotes"]["Update"];
export type QuoteStatus = "下書き" | "提出済み" | "承認済み" | "却下";

// 請求関連
export type Invoice = Database["funeral"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["funeral"]["Tables"]["invoices"]["Insert"];
export type InvoiceUpdate = Database["funeral"]["Tables"]["invoices"]["Update"];
export type InvoiceStatus = "未請求" | "請求済み" | "入金済み" | "延滞";

// タスク関連
export type Task = Database["funeral"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["funeral"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["funeral"]["Tables"]["tasks"]["Update"];
export type TaskStatus = "未着手" | "進行中" | "完了" | "期限切れ";
export type TaskPriority = "低" | "中" | "高";

// 資材関連
export type MaterialOrder = Database["funeral"]["Tables"]["material_orders"]["Row"];
export type MaterialOrderInsert = Database["funeral"]["Tables"]["material_orders"]["Insert"];
export type MaterialOrderUpdate = Database["funeral"]["Tables"]["material_orders"]["Update"];
export type MaterialOrderStatus = "準備中" | "発注済み" | "配送中" | "完了" | "キャンセル";

// 在庫管理
export type InventoryItem = Database["common"]["Tables"]["inventory"]["Row"];
export type InventoryItemInsert = Database["common"]["Tables"]["inventory"]["Insert"];
export type InventoryItemUpdate = Database["common"]["Tables"]["inventory"]["Update"];
export type InventoryStatus = "適正" | "不足" | "過剰";

// 予約関連
export type Reservation = Database["funeral"]["Tables"]["reservations"]["Row"];
export type ReservationInsert = Database["funeral"]["Tables"]["reservations"]["Insert"];
export type ReservationUpdate = Database["funeral"]["Tables"]["reservations"]["Update"];
export type ReservationStatus = "予約済み" | "確定" | "キャンセル" | "完了";

// ユーザー・権限関連（実際のテーブル構造に基づく）
export interface User {
	id: string;
	name: string;
	email: string;
	roleId: string;
	roleName: string;
	createdAt: string;
	updatedAt: string;
}

export interface Role {
	id: string;
	name: string;
	permissions: Permission[];
}

export interface Permission {
	id: string;
	action: string;
	resource: string;
}

// 統計・レポート関連
export interface CaseStatusStats {
	preparation: number;
	inProgress: number;
	completed: number;
	attention: number;
}

export interface TaskStatusStats {
	pending: number;
	inProgress: number;
	overdue: number;
	completed: number;
}

export interface MaterialStats {
	ordersInProgress: number;
	lowStockItems: number;
	monthlyOrderAmount: number;
	totalItems: number;
}

// API レスポンス関連
export interface ApiResponse<T> {
	data: T;
	success: boolean;
	message?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

// 型ガード関数用
export function isCustomerWithDetails(customer: unknown): customer is Customer {
	return Boolean(
		customer &&
			typeof customer === "object" &&
			customer !== null &&
			"id" in customer &&
			typeof (customer as Record<string, unknown>).id === "string" &&
			"name" in customer &&
			typeof (customer as Record<string, unknown>).name === "string",
	);
}

export function isFuneralCaseWithDetails(
	funeralCase: unknown,
): funeralCase is FuneralCaseWithDetails {
	return Boolean(
		funeralCase &&
			typeof funeralCase === "object" &&
			funeralCase !== null &&
			"id" in funeralCase &&
			typeof (funeralCase as Record<string, unknown>).id === "string" &&
			"deceased_name" in funeralCase &&
			typeof (funeralCase as Record<string, unknown>).deceased_name === "string",
	);
}

// 旧型との互換性のため（段階的に削除予定）
/** @deprecated Use Customer instead */
export type LegacyCustomer = Customer;

/** @deprecated Use FuneralCaseWithDetails instead */
export type LegacyFuneralCase = FuneralCaseWithDetails;
