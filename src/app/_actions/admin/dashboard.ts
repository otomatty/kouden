"use server";

import { unstable_cache as cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContactRequestStats } from "./contact-requests";
import { getCampaignApplicationStats } from "./campaign-applications";

// 1. getDashboardSummary
export async function getDashboardSummary() {
	const supabase = await createClient();

	// 未対応のお問い合わせ数を取得 (contact_requestsテーブルのstatusが 'new' または 'in_progress' のもの)
	const { count: openContactsCount, error: openContactsError } = await supabase
		.from("contact_requests")
		.select("*", { count: "exact", head: true })
		.in("status", ["new", "in_progress"]);

	if (openContactsError) {
		console.error("Error fetching open contacts count:", openContactsError.message);
	}

	// 過去24時間のエラー数を取得 (debug_logsテーブルのcreated_atが24時間以内のもの)
	const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
	const { count: recentErrorsCount, error: recentErrorsError } = await supabase
		.from("debug_logs")
		.select("*", { count: "exact", head: true })
		.gte("created_at", twentyFourHoursAgo);

	if (recentErrorsError) {
		console.error("Error fetching recent errors count:", recentErrorsError.message);
	}

	return {
		openTicketsCount: openContactsCount ?? 0,
		recentErrorsCount: recentErrorsCount ?? 0,
	};
}

// 2. getServiceStatus
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const fetchServiceStatus = async (url: string, serviceName: string): Promise<any> => {
	try {
		const response = await fetch(url, { next: { revalidate: 300 } }); // 5分キャッシュ
		if (!response.ok) {
			// APIがエラーを返した場合でも、サービスがダウンしていると解釈できる
			console.warn(`Failed to fetch ${serviceName} status: ${response.status}`);
			return { name: serviceName, status: "degraded" }; // または "outage"
		}
		// const data = await response.json();

		// Vercel のステータスページの例 (実際のエンドポイントとレスポンス構造に合わせる)
		if (serviceName === "Vercel") {
			// ここではダミーで operational を返す
			return { name: serviceName, status: "operational" };
		}
		// Supabase のステータスページの例
		if (serviceName === "Supabase") {
			// Supabaseは通常、全体的なステータスと各サービスのステータスを提供
			// ここではダミーで operational を返す
			return { name: serviceName, status: "operational" };
		}
		// Stripe のステータスページの例
		if (serviceName === "Stripe") {
			// Stripeも詳細なステータスを提供
			// ここではダミーで operational を返す
			return { name: serviceName, status: "operational" };
		}
		return { name: serviceName, status: "operational" }; // デフォルト
	} catch (error) {
		console.error(`Error fetching ${serviceName} status:`, error);
		return { name: serviceName, status: "outage" }; // フェッチ自体に失敗した場合
	}
};

export const getServiceStatus = cache(
	async () => {
		// 実際のステータスエンドポイントURLに置き換える
		const vercelStatusUrl = "https://status.vercel.com/api/v2/status.json"; // 例: Vercel (要確認)
		const supabaseStatusUrl = "https://status.supabase.com/api/v2/status.json"; // 例: Supabase (要確認)
		const stripeStatusUrl = "https://status.stripe.com/api/v2/status.json"; // 例: Stripe (要確認)

		// 各サービスのステータスを並行して取得
		const [vercel, supabase, stripe] = await Promise.all([
			fetchServiceStatus(vercelStatusUrl, "Vercel"),
			fetchServiceStatus(supabaseStatusUrl, "Supabase"),
			fetchServiceStatus(stripeStatusUrl, "Stripe"),
		]);

		return [vercel, supabase, stripe];
	},
	["service-status"], // キャッシュキー
	{ revalidate: 300 }, // 5分間キャッシュ (Next.js 13+ の App Router では fetch の revalidate を使う方が一般的)
);

// 3. getSalesMetrics
export async function getSalesMetrics(range: "7d" | "30d" | "90d" = "30d") {
	const supabase = await createClient();
	const endDate = new Date();
	let days = 30;
	if (range === "7d") days = 7;
	if (range === "90d") days = 90;

	const startDate = new Date();
	startDate.setDate(endDate.getDate() - (days - 1));

	// kouden_purchases テーブルから日別の売上を集計
	const { data, error } = await supabase
		.from("kouden_purchases")
		.select("amount_paid, purchased_at")
		.gte("purchased_at", startDate.toISOString().split("T")[0])
		.lte("purchased_at", endDate.toISOString().split("T")[0])
		.order("purchased_at", { ascending: true });

	if (error) {
		console.error("Error fetching sales metrics:", error.message);
		// エラー時は空のデータ配列を返す
		return Array.from({ length: days }).map((_, i) => {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			return {
				date: date.toISOString().split("T")[0] as string,
				sales: 0,
			};
		});
	}

	// 日別売上を集計
	const salesByDate: Record<string, number> = {};
	if (data) {
		for (const purchase of data) {
			const date = purchase.purchased_at.split("T")[0] || ""; // YYYY-MM-DD
			if (date) {
				salesByDate[date] = (salesByDate[date] || 0) + purchase.amount_paid;
			}
		}
	}

	// 指定期間の全日付をカバーする配列を生成
	const metrics = Array.from({ length: days }).map((_, i) => {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + i);
		const dateStr = date.toISOString().split("T")[0] as string;
		return {
			date: dateStr,
			sales: salesByDate[dateStr] || 0,
		};
	});

	return metrics;
}

// 4. getActivityMetrics
export async function getActivityMetrics(range: "7d" | "30d" | "90d" = "30d") {
	const supabase = await createClient();
	const endDate = new Date();
	let days = 30;
	if (range === "7d") days = 7;
	else if (range === "90d") days = 90;

	const startDate = new Date();
	startDate.setDate(endDate.getDate() - (days - 1));

	// koudens テーブルから日別の作成数を取得
	const { data, error } = await supabase
		.from("koudens")
		.select("created_at")
		.gte("created_at", startDate.toISOString().split("T")[0])
		.lte("created_at", endDate.toISOString().split("T")[0])
		.order("created_at", { ascending: true });

	if (error) {
		console.error("Error fetching activity metrics:", error.message);
		// エラー時は空のデータ配列を返す
		return Array.from({ length: days }).map((_, i) => {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			const dateStr = date.toISOString().split("T")[0] as string;
			return {
				date: dateStr,
				count: 0,
			};
		});
	}

	// 日別作成数を集計
	const countsByDate: Record<string, number> = {};
	if (data) {
		for (const kouden of data) {
			const date = kouden.created_at.split("T")[0] || ""; // YYYY-MM-DD
			if (date) {
				countsByDate[date] = (countsByDate[date] || 0) + 1;
			}
		}
	}

	// 指定期間の全日付をカバーする配列を生成
	const metrics = Array.from({ length: days }).map((_, i) => {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + i);
		const dateStr = date.toISOString().split("T")[0] as string;
		return {
			date: dateStr,
			count: countsByDate[dateStr] || 0,
		};
	});

	return metrics;
}

// 5. getRecentInquiries
export async function getRecentInquiries(limit = 5) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("contact_requests")
		.select("id, subject, category, name, email, created_at, status")
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) {
		console.error("Error fetching recent inquiries:", error.message);
		return [];
	}
	return data;
}

// 6. getRecentErrors
export async function getRecentErrors(limit = 5) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("debug_logs")
		.select("id, action, details, created_at, user_id")
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) {
		console.error("Error fetching recent errors:", error.message);
		// エラー時は空配列を返す
		return [];
	}

	// debug_logsのデータを適切な形式に変換
	return (
		data?.map((log) => ({
			id: log.id,
			message: log.action || "Unknown error",
			path: log.details ? JSON.stringify(log.details) : "No details",
			created_at: log.created_at,
		})) || []
	);
}
