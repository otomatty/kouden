"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

/**
 * 記事の閲覧数を記録する
 * 同一ユーザー・同一IPからの重複アクセスは1時間以内でブロック
 */
export async function recordPostView(postId: string) {
	const supabase = await createClient();
	const headersList = await headers();

	// ユーザー情報取得
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// IP アドレスとUser Agent取得
	const ipAddress =
		headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
	const userAgent = headersList.get("user-agent") || "";

	// セッションID生成（簡易版）
	const sessionId = `${ipAddress}-${Date.now()}`;

	try {
		// 1時間以内の重複チェック（より厳密な重複防止）
		const oneHourAgo = new Date();
		oneHourAgo.setHours(oneHourAgo.getHours() - 1);
		const oneHourAgoIso = oneHourAgo.toISOString();

		let duplicateCheck: boolean;
		if (user?.id) {
			// ログインユーザーの場合：ユーザーIDベースでチェック
			const { data } = await supabase
				.from("post_views")
				.select("id")
				.eq("post_id", postId)
				.eq("user_id", user.id)
				.gte("viewed_at", oneHourAgoIso)
				.limit(1);

			duplicateCheck = !!(data && data.length > 0);
		} else {
			// 未ログインユーザーの場合：IPアドレスベースでチェック
			const { data } = await supabase
				.from("post_views")
				.select("id")
				.eq("post_id", postId)
				.eq("ip_address", ipAddress)
				.gte("viewed_at", oneHourAgoIso)
				.limit(1);

			duplicateCheck = !!(data && data.length > 0);
		}

		// 重複がない場合のみ記録
		if (!duplicateCheck) {
			// post_viewsテーブルに閲覧記録を挿入（トリガーが自動でpost_statsを更新）
			const { error: viewError } = await supabase.from("post_views").insert({
				post_id: postId,
				user_id: user?.id || null,
				ip_address: ipAddress,
				user_agent: userAgent,
				session_id: sessionId,
			});

			if (viewError) {
				return { success: false, error: "Failed to record view" };
			}

			return { success: true, recorded: true };
		}
		// 重複のため記録をスキップ
		return { success: true, recorded: false };
	} catch {
		return { success: false, error: "Failed to record view" };
	}
}

/**
 * 記事の統計情報を取得する
 */
export async function getPostStats(postId: string) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("post_stats")
		.select("view_count, bookmark_count, last_viewed_at")
		.eq("post_id", postId)
		.single();

	if (error) {
		// データが存在しない場合は初期値を返す
		return {
			view_count: 0,
			bookmark_count: 0,
			last_viewed_at: null,
		};
	}

	return data;
}

/**
 * 複数記事の統計情報を一括取得する
 */
export async function getBulkPostStats(postIds: string[]) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("post_stats")
		.select("post_id, view_count, bookmark_count")
		.in("post_id", postIds);

	if (error) {
		console.error("Failed to fetch bulk post stats:", error);
		return {};
	}

	// post_id をキーとしたオブジェクトに変換
	return data.reduce(
		(acc, stat) => {
			acc[stat.post_id] = {
				view_count: stat.view_count,
				bookmark_count: stat.bookmark_count,
			};
			return acc;
		},
		{} as Record<string, { view_count: number; bookmark_count: number }>,
	);
}

/**
 * 人気記事を取得する（閲覧数とブックマーク数でソート）
 */
export async function getPopularPosts(limit = 10, period: "week" | "month" | "all" = "all") {
	const supabase = await createClient();

	// 期間フィルタリングの日付計算
	let dateFilter: string | null = null;
	if (period === "week") {
		const weekAgo = new Date();
		weekAgo.setDate(weekAgo.getDate() - 7);
		dateFilter = weekAgo.toISOString();
	} else if (period === "month") {
		const monthAgo = new Date();
		monthAgo.setMonth(monthAgo.getMonth() - 1);
		dateFilter = monthAgo.toISOString();
	}

	let query = supabase
		.from("posts")
		.select(`
      id,
      title,
      slug,
      excerpt,
      category,
      published_at,
      post_stats!inner(view_count, bookmark_count)
    `)
		.eq("status", "published");

	// 期間フィルタリング適用
	if (dateFilter) {
		query = query.gte("published_at", dateFilter);
	}

	const { data, error } = await query.order("published_at", { ascending: false }).limit(limit * 2); // 多めに取得してからソート

	if (error) {
		console.error("Failed to fetch popular posts:", error);
		return { data: [], error: error.message };
	}

	// 人気度スコアでソート（ブックマーク数を3倍重み付け）
	const sortedPosts = data
		.map((post) => ({
			...post,
			view_count: post.post_stats?.view_count || 0,
			bookmark_count: post.post_stats?.bookmark_count || 0,
			popularity_score:
				(post.post_stats?.view_count || 0) + (post.post_stats?.bookmark_count || 0) * 3,
		}))
		.sort((a, b) => b.popularity_score - a.popularity_score)
		.slice(0, limit);

	return { data: sortedPosts, error: null };
}

/**
 * 関連記事を取得する（カテゴリとタグベース）
 */
export async function getRelatedPosts(
	currentPostId: string,
	options: {
		category?: string;
		tags?: string[];
		limit?: number;
	} = {},
) {
	const { category, tags, limit = 3 } = options;
	const supabase = await createClient();

	let query = supabase
		.from("posts")
		.select(`
      id,
      title,
      slug,
      excerpt,
      category,
      tags,
      published_at,
      post_stats(view_count, bookmark_count)
    `)
		.eq("status", "published")
		.neq("id", currentPostId);

	// カテゴリが一致する記事を優先
	if (category) {
		query = query.eq("category", category);
	}

	const { data: categoryPosts, error } = await query.limit(limit * 2);

	if (error) {
		console.error("Failed to fetch related posts:", error);
		return { data: [], error: error.message };
	}

	let relatedPosts = categoryPosts || [];

	// タグが指定されている場合、タグの一致度でさらにフィルタリング
	if (tags && tags.length > 0) {
		relatedPosts = relatedPosts
			.map((post) => {
				const postTags = post.tags || [];
				const matchingTags = tags.filter((tag) => postTags.includes(tag));
				return {
					...post,
					tag_match_count: matchingTags.length,
				};
			})
			.sort((a, b) => (b.tag_match_count || 0) - (a.tag_match_count || 0));
	}

	// 人気度も考慮してソート
	relatedPosts = relatedPosts
		.map((post) => ({
			...post,
			view_count: post.post_stats?.view_count || 0,
			bookmark_count: post.post_stats?.bookmark_count || 0,
		}))
		.sort((a, b) => {
			// タグマッチ数が同じ場合は人気度でソート
			const aTagCount = (a as { tag_match_count?: number }).tag_match_count || 0;
			const bTagCount = (b as { tag_match_count?: number }).tag_match_count || 0;

			if (aTagCount === bTagCount) {
				const aScore = a.view_count + a.bookmark_count * 2;
				const bScore = b.view_count + b.bookmark_count * 2;
				return bScore - aScore;
			}
			return bTagCount - aTagCount;
		})
		.slice(0, limit);

	return { data: relatedPosts, error: null };
}
