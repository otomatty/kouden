"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type ContactRequestRow = Database["public"]["Tables"]["contact_requests"]["Row"];

/**
 * 管理者権限チェック
 * `withActionResult` がエラーをクライアント向けの ActionResult に変換するため、
 * リダイレクトではなく KoudenError を throw する。
 */
async function assertAdmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
	}

	const { data: isAdmin } = await supabase.rpc("is_admin", {
		user_uid: user.id,
	});

	if (!isAdmin) {
		throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
	}

	return { supabase, user };
}

/**
 * お問い合わせ一覧を取得
 */
export async function getContactRequests(params?: {
	status?: string;
	category?: string;
	page?: number;
	limit?: number;
}): Promise<
	ActionResult<{
		data: ContactRequestRow[];
		count: number;
		page: number;
		limit: number;
		totalPages: number;
	}>
> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

		let query = supabase
			.from("contact_requests")
			.select("*")
			.order("created_at", { ascending: false });

		// フィルタリング
		if (params?.status) {
			query = query.eq("status", params.status);
		}
		if (params?.category) {
			query = query.eq("category", params.category);
		}

		// ページネーション
		const page = params?.page || 1;
		const limit = params?.limit || 20;
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		query = query.range(from, to);

		const { data, error, count } = await query;

		if (error) throw error;

		return {
			data: data || [],
			count: count || 0,
			page,
			limit,
			totalPages: Math.ceil((count || 0) / limit),
		};
	}, "お問い合わせ一覧の取得");
}

/**
 * お問い合わせ詳細を取得
 */
export async function getContactRequestDetail(
	requestId: string,
): Promise<ActionResult<ContactRequestRow & { contact_request_attachments: unknown[] }>> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

		const { data, error } = await supabase
			.from("contact_requests")
			.select(`
				*,
				contact_request_attachments (
					id,
					file_url,
					file_name,
					uploaded_at
				)
			`)
			.eq("id", requestId)
			.single();

		if (error) throw error;
		return data;
	}, "お問い合わせ詳細の取得");
}

/**
 * お問い合わせのステータスを更新
 */
export async function updateContactRequestStatus(
	requestId: string,
	status: "new" | "in_progress" | "closed",
): Promise<ActionResult<ContactRequestRow>> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

		const { data, error } = await supabase
			.from("contact_requests")
			.update({
				status,
				updated_at: new Date().toISOString(),
			})
			.eq("id", requestId)
			.select()
			.single();

		if (error) throw error;
		return data;
	}, "お問い合わせステータスの更新");
}

/**
 * お問い合わせの統計情報を取得
 */
export async function getContactRequestStats(): Promise<
	ActionResult<{
		total: number;
		statusStats: Record<string, number>;
		categoryStats: Record<string, number>;
	}>
> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

		// 全体の統計
		const { data: totalData, error: totalError } = await supabase
			.from("contact_requests")
			.select("status", { count: "exact" });

		if (totalError) throw totalError;

		// ステータス別の統計
		const { data: statusData, error: statusError } = await supabase
			.from("contact_requests")
			.select("status")
			.order("status");

		if (statusError) throw statusError;

		// カテゴリ別の統計
		const { data: categoryData, error: categoryError } = await supabase
			.from("contact_requests")
			.select("category")
			.order("category");

		if (categoryError) throw categoryError;

		// 統計を集計
		const statusStats =
			statusData?.reduce(
				(acc, item) => {
					acc[item.status] = (acc[item.status] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			) || {};

		const categoryStats =
			categoryData?.reduce(
				(acc, item) => {
					acc[item.category] = (acc[item.category] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			) || {};

		return {
			total: totalData?.length || 0,
			statusStats,
			categoryStats,
		};
	}, "お問い合わせ統計の取得");
}
