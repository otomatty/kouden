"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import type { Database } from "@/types/supabase";

type CampaignApplicationRow =
	Database["public"]["Tables"]["campaign_hearing_applications"]["Row"];

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
 * キャンペーン申し込み一覧を取得
 */
export async function getCampaignApplications(params?: {
	status?: string;
	page?: number;
	limit?: number;
}): Promise<
	ActionResult<{
		data: CampaignApplicationRow[];
		count: number;
		page: number;
		limit: number;
		totalPages: number;
	}>
> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

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

		if (error) throw error;

		return {
			data: data || [],
			count: count || 0,
			page,
			limit,
			totalPages: Math.ceil((count || 0) / limit),
		};
	}, "キャンペーン申し込み一覧の取得");
}

/**
 * キャンペーン申し込み詳細を取得
 */
export async function getCampaignApplication(
	id: string,
): Promise<ActionResult<CampaignApplicationRow>> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

		const { data, error } = await supabase
			.from("campaign_hearing_applications")
			.select("*")
			.eq("id", id)
			.single();

		if (error) throw error;
		return data;
	}, "キャンペーン申し込み詳細の取得");
}

/**
 * キャンペーン申し込みのステータスを更新
 */
export async function updateCampaignApplicationStatus(
	applicationId: string,
	status: "submitted" | "confirmed" | "completed" | "cancelled",
): Promise<ActionResult<CampaignApplicationRow>> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

		const { data, error } = await supabase
			.from("campaign_hearing_applications")
			.update({
				status,
				updated_at: new Date().toISOString(),
			})
			.eq("id", applicationId)
			.select()
			.single();

		if (error) throw error;
		return data;
	}, "キャンペーン申し込みステータスの更新");
}

/**
 * キャンペーン申し込みの統計情報を取得
 */
export async function getCampaignApplicationStats(): Promise<
	ActionResult<{
		total: number;
		today: number;
		thisWeek: number;
		statusStats: Record<string, number>;
	}>
> {
	return withActionResult(async () => {
		const { supabase } = await assertAdmin();

		// 全体の統計
		const { data: totalData, error: totalError } = await supabase
			.from("campaign_hearing_applications")
			.select("status", { count: "exact" });

		if (totalError) throw totalError;

		// ステータス別の統計
		const { data: statusData, error: statusError } = await supabase
			.from("campaign_hearing_applications")
			.select("status")
			.order("status");

		if (statusError) throw statusError;

		// 今日の申し込み
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const { data: todayData, error: todayError } = await supabase
			.from("campaign_hearing_applications")
			.select("id", { count: "exact" })
			.gte("created_at", today.toISOString());

		if (todayError) throw todayError;

		// 今週の申し込み
		const weekStart = new Date();
		weekStart.setDate(weekStart.getDate() - weekStart.getDay());
		weekStart.setHours(0, 0, 0, 0);
		const { data: weekData, error: weekError } = await supabase
			.from("campaign_hearing_applications")
			.select("id", { count: "exact" })
			.gte("created_at", weekStart.toISOString());

		if (weekError) throw weekError;

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
	}, "キャンペーン申し込み統計の取得");
}
