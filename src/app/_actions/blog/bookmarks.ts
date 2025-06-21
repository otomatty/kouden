"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * ブックマークの切り替え（追加/削除）
 */
export async function toggleBookmark(postId: string) {
	const supabase = await createClient();

	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();
	if (authError || !user) {
		return { success: false, error: "Authentication required" };
	}

	try {
		// 既存のブックマークを確認
		const { data: existing } = await supabase
			.from("post_bookmarks")
			.select("id")
			.eq("post_id", postId)
			.eq("user_id", user.id)
			.single();

		if (existing) {
			// ブックマーク削除（トリガーが自動でpost_statsを更新）
			const { error } = await supabase.from("post_bookmarks").delete().eq("id", existing.id);

			if (error) throw error;

			revalidatePath("/blog");
			revalidatePath(`/blog/${postId}`);
			return { success: true, bookmarked: false };
		}

		// ブックマーク追加（トリガーが自動でpost_statsを更新）
		const { error } = await supabase.from("post_bookmarks").insert({
			post_id: postId,
			user_id: user.id,
		});

		if (error) throw error;

		revalidatePath("/blog");
		revalidatePath(`/blog/${postId}`);
		return { success: true, bookmarked: true };
	} catch (error) {
		console.error("Failed to toggle bookmark:", error);
		return { success: false, error: "Failed to update bookmark" };
	}
}

/**
 * ユーザーのブックマーク一覧を取得
 */
export async function getUserBookmarks(userId?: string) {
	const supabase = await createClient();

	// ユーザーIDが指定されていない場合は現在のユーザーを取得
	let targetUserId = userId;
	if (!targetUserId) {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return { data: [], error: "Authentication required" };
		}
		targetUserId = user.id;
	}

	const { data, error } = await supabase
		.from("post_bookmarks")
		.select(`
      id,
      created_at,
      post:posts(
        id,
        title,
        slug,
        excerpt,
        category,
        published_at,
        post_stats(view_count, bookmark_count)
      )
    `)
		.eq("user_id", targetUserId)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Failed to fetch bookmarks:", error);
		return { data: [], error: error.message };
	}

	return { data, error: null };
}

/**
 * 指定した記事がユーザーにブックマークされているかチェック
 */
export async function isPostBookmarked(postId: string, userId?: string) {
	const supabase = await createClient();

	// ユーザーIDが指定されていない場合は現在のユーザーを取得
	let targetUserId = userId;
	if (!targetUserId) {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return false;
		}
		targetUserId = user.id;
	}

	const { data } = await supabase
		.from("post_bookmarks")
		.select("id")
		.eq("post_id", postId)
		.eq("user_id", targetUserId)
		.single();

	return !!data;
}

/**
 * 複数記事のブックマーク状態を一括チェック
 */
export async function getBulkBookmarkStatus(postIds: string[], userId?: string) {
	const supabase = await createClient();

	// ユーザーIDが指定されていない場合は現在のユーザーを取得
	let targetUserId = userId;
	if (!targetUserId) {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return {};
		}
		targetUserId = user.id;
	}

	const { data, error } = await supabase
		.from("post_bookmarks")
		.select("post_id")
		.eq("user_id", targetUserId)
		.in("post_id", postIds);

	if (error) {
		console.error("Failed to fetch bulk bookmark status:", error);
		return {};
	}

	// post_id をキーとしたオブジェクトに変換
	return data.reduce(
		(acc, bookmark) => {
			acc[bookmark.post_id] = true;
			return acc;
		},
		{} as Record<string, boolean>,
	);
}

/**
 * ブックマーク数の統計を取得
 */
export async function getBookmarkStats(userId?: string) {
	const supabase = await createClient();

	// ユーザーIDが指定されていない場合は現在のユーザーを取得
	let targetUserId = userId;
	if (!targetUserId) {
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return { total: 0, byCategory: {} };
		}
		targetUserId = user.id;
	}

	const { data, error } = await supabase
		.from("post_bookmarks")
		.select(`
      id,
      post:posts(category)
    `)
		.eq("user_id", targetUserId);

	if (error) {
		console.error("Failed to fetch bookmark stats:", error);
		return { total: 0, byCategory: {} };
	}

	const total = data.length;
	const byCategory = data.reduce(
		(acc, bookmark) => {
			const category = bookmark.post?.category || "その他";
			acc[category] = (acc[category] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	return { total, byCategory };
}
