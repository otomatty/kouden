"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * プロフィールの存在確認
 * @returns プロフィール
 */
export async function ensureProfile() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return { error: "認証が必要です" };
		}

		// プロフィールの存在確認
		const { data: profile } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", user.id)
			.single();

		if (!profile) {
			// プロフィールが存在しない場合は作成
			const { error: insertError } = await supabase.from("profiles").insert({
				id: user.id,
				display_name: user.user_metadata.name || user.email,
				avatar_url: user.user_metadata.avatar_url,
			});

			if (insertError) {
				throw insertError;
			}
		}

		return { success: true };
	} catch (error) {
		console.error("[ERROR] Error ensuring profile:", error);
		return { error: "プロフィールの確認に失敗しました" };
	}
}

/**
 * 現在のユーザー情報を取得
 * @returns ユーザー情報
 */
export async function getCurrentUser() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		return user;
	} catch (error) {
		console.error("[ERROR] Error getting current user:", error);
		return null;
	}
}
