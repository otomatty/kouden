"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * 管理者権限チェック
 */
async function checkAdminPermission() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	const { data: isAdmin } = await supabase.rpc("is_admin", {
		user_uid: user.id,
	});

	if (!isAdmin) {
		throw new Error("管理者権限が必要です");
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
}) {
	const { supabase } = await checkAdminPermission();

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

	if (error) {
		console.error("Failed to fetch contact requests:", error);
		throw new Error(error.message);
	}

	return {
		data: data || [],
		count: count || 0,
		page,
		limit,
		totalPages: Math.ceil((count || 0) / limit),
	};
}

/**
 * お問い合わせ詳細を取得
 */
export async function getContactRequestDetail(requestId: string) {
	const { supabase } = await checkAdminPermission();

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

	if (error) {
		console.error("Failed to fetch contact request detail:", error);
		throw new Error(error.message);
	}

	return data;
}

/**
 * お問い合わせのステータスを更新
 */
export async function updateContactRequestStatus(
	requestId: string,
	status: "new" | "in_progress" | "closed",
) {
	const { supabase } = await checkAdminPermission();

	const { data, error } = await supabase
		.from("contact_requests")
		.update({
			status,
			updated_at: new Date().toISOString(),
		})
		.eq("id", requestId)
		.select()
		.single();

	if (error) {
		console.error("Failed to update contact request status:", error);
		throw new Error(error.message);
	}

	return data;
}

/**
 * お問い合わせの統計情報を取得
 */
export async function getContactRequestStats() {
	const { supabase } = await checkAdminPermission();

	// 全体の統計
	const { data: totalData, error: totalError } = await supabase
		.from("contact_requests")
		.select("status", { count: "exact" });

	if (totalError) {
		console.error("Failed to fetch total stats:", totalError);
		throw new Error(totalError.message);
	}

	// ステータス別の統計
	const { data: statusData, error: statusError } = await supabase
		.from("contact_requests")
		.select("status")
		.order("status");

	if (statusError) {
		console.error("Failed to fetch status stats:", statusError);
		throw new Error(statusError.message);
	}

	// カテゴリ別の統計
	const { data: categoryData, error: categoryError } = await supabase
		.from("contact_requests")
		.select("category")
		.order("category");

	if (categoryError) {
		console.error("Failed to fetch category stats:", categoryError);
		throw new Error(categoryError.message);
	}

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
}
