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
 * キャンペーン申し込み一覧を取得
 */
export async function getCampaignApplications(params?: {
	status?: string;
	page?: number;
	limit?: number;
}) {
	const { supabase } = await checkAdminPermission();

	let query = supabase
		.from("campaign_hearing_applications")
		.select("*")
		.order("created_at", { ascending: false });

	// フィルタリング
	if (params?.status) {
		query = query.eq("status", params.status);
	}

	// ページネーション
	const page = params?.page || 1;
	const limit = params?.limit || 20;
	const from = (page - 1) * limit;
	const to = from + limit - 1;

	query = query.range(from, to);

	const { data, error, count } = await query;

	if (error) {
		console.error("Failed to fetch campaign applications:", error);
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
 * キャンペーン申し込み詳細を取得
 */
export async function getCampaignApplication(id: string) {
	const { supabase } = await checkAdminPermission();

	const { data, error } = await supabase
		.from("campaign_hearing_applications")
		.select("*")
		.eq("id", id)
		.single();

	if (error) {
		console.error("Failed to fetch campaign application:", error);
		throw new Error(error.message);
	}

	return data;
}

/**
 * キャンペーン申し込みのステータスを更新
 */
export async function updateCampaignApplicationStatus(
	applicationId: string,
	status: "submitted" | "confirmed" | "completed" | "cancelled",
) {
	const { supabase } = await checkAdminPermission();

	const { data, error } = await supabase
		.from("campaign_hearing_applications")
		.update({
			status,
			updated_at: new Date().toISOString(),
		})
		.eq("id", applicationId)
		.select()
		.single();

	if (error) {
		console.error("Failed to update application status:", error);
		throw new Error(error.message);
	}

	return data;
}

/**
 * キャンペーン申し込みの統計情報を取得
 */
export async function getCampaignApplicationStats() {
	const { supabase } = await checkAdminPermission();

	// 全体の統計
	const { data: totalData, error: totalError } = await supabase
		.from("campaign_hearing_applications")
		.select("status", { count: "exact" });

	if (totalError) {
		console.error("Failed to fetch total stats:", totalError);
		throw new Error(totalError.message);
	}

	// ステータス別の統計
	const { data: statusData, error: statusError } = await supabase
		.from("campaign_hearing_applications")
		.select("status")
		.order("status");

	if (statusError) {
		console.error("Failed to fetch status stats:", statusError);
		throw new Error(statusError.message);
	}

	// 今日の申し込み
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const { data: todayData, error: todayError } = await supabase
		.from("campaign_hearing_applications")
		.select("id", { count: "exact" })
		.gte("created_at", today.toISOString());

	if (todayError) {
		console.error("Failed to fetch today stats:", todayError);
		throw new Error(todayError.message);
	}

	// 今週の申し込み
	const weekStart = new Date();
	weekStart.setDate(weekStart.getDate() - weekStart.getDay());
	weekStart.setHours(0, 0, 0, 0);
	const { data: weekData, error: weekError } = await supabase
		.from("campaign_hearing_applications")
		.select("id", { count: "exact" })
		.gte("created_at", weekStart.toISOString());

	if (weekError) {
		console.error("Failed to fetch week stats:", weekError);
		throw new Error(weekError.message);
	}

	// 統計を集計
	const statusStats =
		statusData?.reduce(
			(acc, item) => {
				acc[item.status || ""] = (acc[item.status || ""] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		) || {};

	return {
		total: totalData?.length || 0,
		today: todayData?.length || 0,
		thisWeek: weekData?.length || 0,
		statusStats,
	};
}
