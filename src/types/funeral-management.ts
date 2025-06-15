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
	// 更新対象のID（必須）
	id: string;

	// 基本情報
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

// 顧客ステータス
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
	deceased_name?: string;
	venue?: string;
	start_datetime?: string;
	status?: CaseStatus;
}

// 案件ステータス
export type CaseStatus = "準備中" | "進行中" | "完了" | "キャンセル";

// 参列者関連
export type Attendee = Database["funeral"]["Tables"]["attendees"]["Row"];
export type AttendeeInsert = Database["funeral"]["Tables"]["attendees"]["Insert"];
export type AttendeeUpdate = Database["funeral"]["Tables"]["attendees"]["Update"];

// 香典記録関連（葬儀管理システム側）
export type Donation = Database["funeral"]["Tables"]["donations"]["Row"];
export type DonationInsert = Database["funeral"]["Tables"]["donations"]["Insert"];
export type DonationUpdate = Database["funeral"]["Tables"]["donations"]["Update"];

// 見積関連
export type Quote = Database["funeral"]["Tables"]["quotes"]["Row"];
export type QuoteInsert = Database["funeral"]["Tables"]["quotes"]["Insert"];
export type QuoteUpdate = Database["funeral"]["Tables"]["quotes"]["Update"];

// 請求関連
export type Invoice = Database["funeral"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["funeral"]["Tables"]["invoices"]["Insert"];
export type InvoiceUpdate = Database["funeral"]["Tables"]["invoices"]["Update"];

// タスク関連
export type Task = Database["funeral"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["funeral"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["funeral"]["Tables"]["tasks"]["Update"];

// 資材発注関連
export type MaterialOrder = Database["funeral"]["Tables"]["material_orders"]["Row"];
export type MaterialOrderInsert = Database["funeral"]["Tables"]["material_orders"]["Insert"];
export type MaterialOrderUpdate = Database["funeral"]["Tables"]["material_orders"]["Update"];

// 在庫関連
export interface InventoryItem {
	id: string;
	name: string;
	category: string;
	current_stock: number;
	minimum_stock: number;
	unit: string;
}

// 予約関連
export type Reservation = Database["funeral"]["Tables"]["reservations"]["Row"];
export type ReservationInsert = Database["funeral"]["Tables"]["reservations"]["Insert"];
export type ReservationUpdate = Database["funeral"]["Tables"]["reservations"]["Update"];

// 連絡管理関連
export interface ContactTemplate {
	id: string;
	name: string;
	type: "email" | "sms";
	subject?: string;
	content: string;
	variables: string[];
}

export interface ContactHistory {
	id: string;
	customer_id: string;
	type: "email" | "sms";
	subject?: string;
	content: string;
	sent_at: string;
	status: "sent" | "delivered" | "failed";
}

// レポート関連
export interface MonthlySalesReport {
	month: string;
	total_cases: number;
	total_revenue: number;
	average_case_value: number;
	completion_rate: number;
}

export interface VenueUsageReport {
	venue_name: string;
	usage_count: number;
	revenue: number;
	utilization_rate: number;
}

export interface KPIMetrics {
	total_cases: number;
	active_cases: number;
	completed_cases: number;
	customer_satisfaction: number;
	average_case_duration: number;
	revenue_growth: number;
}

// ユーザー・権限関連
export interface StaffMember {
	id: string;
	name: string;
	email: string;
	role: "manager" | "coordinator" | "assistant";
	permissions: string[];
	active: boolean;
}

// システム設定関連
export interface SystemSettings {
	company_name: string;
	company_address: string;
	company_phone: string;
	company_email: string;
	default_venue: string;
	notification_settings: {
		email_notifications: boolean;
		sms_notifications: boolean;
		reminder_days: number;
	};
}

// 型ガード関数
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

// 下位互換性のための型エイリアス
/** @deprecated Use FuneralCaseWithDetails instead */
export type LegacyFuneralCase = FuneralCaseWithDetails;

// ===== 香典帳連携関連の型定義 =====

// 葬儀案件と香典帳の連携
export interface FuneralKoudenCase {
	id: string;
	organization_id: string;
	case_id: string;
	kouden_id: string;
	proxy_manager_id: string;
	family_user_id: string | null;
	status: "proxy_managed" | "transferred" | "completed";
	created_at: string;
	updated_at: string | null;
}

// 香典帳作成用の入力型
export interface CreateKoudenForCaseInput {
	caseId: string;
	title: string;
	description?: string;
}

// 香典帳作成結果
export interface CreateKoudenForCaseResult {
	success: boolean;
	koudenId?: string;
	error?: string;
}

// 所有権移譲結果
export interface TransferOwnershipResult {
	success: boolean;
	error?: string;
}

// 香典帳情報（葬儀管理システム側で表示用）
export interface KoudenInfo {
	id: string;
	title: string;
	description: string | null;
	status: string;
	created_at: string;
	updated_at: string | null;
}

// 葬儀案件と香典帳の連携情報（結合済み）
export interface FuneralKoudenCaseWithDetails extends FuneralKoudenCase {
	koudens: KoudenInfo | null;
	case?: FuneralCaseWithDetails;
}

// 香典帳代理管理者の権限
export type FuneralCompanyPermission =
	| "view" // 閲覧
	| "edit" // 編集
	| "manage_entries" // 香典記録管理
	| "manage_returns" // 返礼品管理
	| "transfer_ownership"; // 所有権移譲
