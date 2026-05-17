"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { revalidatePath } from "next/cache";

type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];

interface UpdateSettingsParams {
	guide_mode?: boolean;
	theme?: "light" | "dark" | "system";
}

/**
 * 認証セッションから取得した `auth.uid()` と引数の `userId` の一致を確認する。
 *
 * Server Action はネットワーク経由で公開される endpoint であるため、
 * クライアントから渡された `userId` は信用せず、必ずセッションと突き合わせる
 * (IDOR 対策)。
 */
async function assertOwnSettings(userId: string): Promise<void> {
	const supabase = await createClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
	}

	if (user.id !== userId) {
		throw new KoudenError("他ユーザーの設定にはアクセスできません", ErrorCodes.FORBIDDEN);
	}
}

/**
 * ログイン中ユーザーの設定を取得する。
 *
 * @param userId 取得対象のユーザー ID。セッションの `auth.uid()` と一致しない場合は
 *   `FORBIDDEN` で失敗する。
 * @returns `ActionResult<UserSettings>`
 */
export async function getUserSettings(userId: string): Promise<ActionResult<UserSettings>> {
	return withActionResult(async () => {
		await assertOwnSettings(userId);
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("user_settings")
			.select("*")
			.eq("id", userId)
			.single();

		if (error) throw error;
		return data;
	}, "ユーザー設定の取得");
}

/**
 * ログイン中ユーザーの設定を更新する。
 *
 * @param userId 更新対象のユーザー ID。セッションの `auth.uid()` と一致しない場合は
 *   `FORBIDDEN` で失敗する。
 * @param params 更新するフィールド（部分更新）。
 * @returns 更新後の `UserSettings` を含む `ActionResult`
 */
export async function updateUserSettings(
	userId: string,
	params: UpdateSettingsParams,
): Promise<ActionResult<UserSettings>> {
	return withActionResult(async () => {
		await assertOwnSettings(userId);
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("user_settings")
			.update({
				...params,
				updated_at: new Date().toISOString(),
			})
			.eq("id", userId)
			.select()
			.single();

		if (error) throw error;

		revalidatePath("/settings");
		return data;
	}, "ユーザー設定の更新");
}

/**
 * ユーザーのガイド表示設定を取得する。
 *
 * `ActionResult` ではなく `boolean` を直接返す:
 * - 取得失敗時もユーザー操作を妨げないようフォールバック値を返す責務がある
 * - 呼び出し元が「失敗時の挙動」を判定する必要がない
 *
 * @returns ガイドを表示するかどうか（取得失敗時は `true` フォールバック）
 */
export async function getGuideVisibility(): Promise<boolean> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			logger.error(
				{
					error: userError?.message,
				},
				"getGuideVisibility: ユーザー情報の取得に失敗",
			);
			return true;
		}

		const { data, error } = await supabase
			.from("user_settings")
			.select("guide_mode")
			.eq("id", user.id)
			.single();

		if (error) {
			logger.error(
				{
					error: error.message,
					code: error.code,
					userId: user.id,
				},
				"getGuideVisibility: 設定の取得に失敗",
			);
			return true;
		}

		const guideMode = data?.guide_mode ?? true;
		return guideMode;
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
			},
			"getGuideVisibility: 予期せぬエラーが発生",
		);
		return true;
	}
}

/**
 * ガイドの表示設定を更新する
 * @param show ガイドを表示するかどうか
 */
export async function updateGuideVisibility(show: boolean): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		const { error } = await supabase
			.from("user_settings")
			.update({
				guide_mode: show,
				updated_at: new Date().toISOString(),
			})
			.eq("id", user.id);

		if (error) throw error;

		revalidatePath("/koudens");
		return null;
	}, "ガイド表示設定の更新");
}
