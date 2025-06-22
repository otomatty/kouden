"use server";

import { unstable_cache as cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// 1. getDashboardSummary
export async function getDashboardSummary() {
	const supabase = await createClient();
	// 未対応の問い合わせ数を取得 (support_ticketsテーブルのstatusが 'open' のもの)
	const { count: openTicketsCount, error: openTicketsError } = await supabase
		.from("support_tickets")
		.select("*", { count: "exact", head: true })
		.eq("status", "open");

	if (openTicketsError) {
		console.error("Error fetching open tickets count:", openTicketsError.message);
		// エラー時はnullまたはエラーオブジェクトを返すなど、適切なエラーハンドリングを行う
	}

	// 過去24時間のエラー数を取得 (error_logsテーブルのcreated_atが24時間以内のもの)
	// 注意: error_logs テーブルが存在しないため、一旦ダミーデータを返す
	// const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
	// const { count: recentErrorsCount, error: recentErrorsError } = await supabase
	//   .from('error_logs')
	//   .select('*', { count: 'exact', head: true })
	//   .gte('created_at', twentyFourHoursAgo);

	// if (recentErrorsError) {
	//   console.error('Error fetching recent errors count:', recentErrorsError.message);
	// }

	return {
		openTicketsCount: openTicketsCount ?? 0,
		recentErrorsCount: 0, // ダミーデータ
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
		const data = await response.json();

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

		return [
			vercel,
			supabase,
			stripe,
		];
	},
	["service-status"], // キャッシュキー
	{ revalidate: 300 }, // 5分間キャッシュ (Next.js 13+ の App Router では fetch の revalidate を使う方が一般的)
);


// 3. getSalesMetrics
export async function getSalesMetrics(range: "7d" | "30d" | "90d" = "30d") {
	// 注意: 事前集計されたDBの売上テーブル (例: daily_sales) が必要
	// この例ではダミーデータを生成
	const endDate = new Date();
	let days = 30;
	if (range === "7d") days = 7;
	if (range === "90d") days = 90;

	const data = Array.from({ length: days }).map((_, i) => {
		const date = new Date();
		date.setDate(endDate.getDate() - (days - 1 - i));
		return {
			date: date.toISOString().split("T")[0], // YYYY-MM-DD
			sales: Math.floor(Math.random() * 5000) + 1000, // 1000から5999のランダムな売上
		};
	});
	return data;
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

	// kouden_entries テーブルから日別の作成数を集計
	// kouden_entries には created_at があると仮定
	const { data, error } = await supabase.rpc('get_daily_kouden_creation_counts', {
		start_date: startDate.toISOString().split("T")[0],
		end_date: endDate.toISOString().split("T")[0]
	});


	if (error) {
		console.error("Error fetching activity metrics:", error.message);
		// エラー時は空配列または適切なエラー情報を返す
		return [];
	}

	// データを整形して返す
	const metrics = Array.from({ length: days }).map((_, i) => {
		const d = new Date(startDate);
		d.setDate(startDate.getDate() + i);
		const dateStr = d.toISOString().split("T")[0];
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const found = data?.find((row: any) => row.creation_date === dateStr);
		return {
			date: dateStr,
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			count: found ? (found as any).count : 0,
		};
	});

	return metrics;
}

// 5. getRecentInquiries
export async function getRecentInquiries(limit = 5) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("support_tickets")
		.select("id, subject, user_email, created_at, status") // user_emailはprofilesテーブルなどからJOINする必要があるかもしれない
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
	// 注意: error_logs テーブルが存在しないため、ダミーデータを返す
	// const supabase = await createClient();
	// const { data, error } = await supabase
	//   .from('error_logs')
	//   .select('id, message, path, created_at') // path はエラーが発生したURLなど
	//   .order('created_at', { ascending: false })
	//   .limit(limit);

	// if (error) {
	//   console.error('Error fetching recent errors:', error.message);
	//   return [];
	// }
	// return data;

	// ダミーデータ
	return Array.from({ length: limit }).map((_, i) => ({
		id: `dummy-error-${i}`,
		message: `This is a sample error message ${i + 1}`,
		path: `/example/path/${i + 1}`,
		created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(), // 1時間おきのエラー
	}));
}

// getActivityMetrics のためのDB関数 (SupabaseのSQLエディタで実行)
/*
CREATE OR REPLACE FUNCTION get_daily_kouden_creation_counts(start_date date, end_date date)
RETURNS TABLE(creation_date date, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as creation_date,
    COUNT(*) as count
  FROM
    public.kouden_entries -- kouden_entries テーブルを直接参照
  WHERE
    created_at >= start_date AND created_at < (end_date + INTERVAL '1 day')
  GROUP BY
    DATE(created_at)
  ORDER BY
    creation_date;
END;
$$ LANGUAGE plpgsql;
*/
