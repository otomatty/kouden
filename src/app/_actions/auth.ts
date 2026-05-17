"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

/**
 * プロフィールの存在確認
 * @returns プロフィール
 */
export async function ensureProfile(): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
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

		return null;
	}, "プロフィールの確認");
}

/**
 * 現在のユーザー情報を取得
 *
 * 失敗時は `null` フォールバックを返すため `ActionResult` ではなく
 * `User | null` を直接返す。
 *
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
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
			},
			"Error getting current user",
		);
		return null;
	}
}
