import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { UserAuthInfo } from "./types";

/**
 * Admin APIを使用してユーザーの認証情報を取得
 * 注意: この関数を呼び出す前に、呼び出し元で管理者権限をチェックすること
 */
export async function getUserAuthInfo(userId: string): Promise<UserAuthInfo> {
	const supabase = await createClient();

	try {
		const { data: authUser, error } = await supabase.auth.admin.getUserById(userId);

		if (error) {
			// 権限エラーの場合は警告レベルで記録
			if (error.code === "not_admin") {
				logger.warn(
					{
						userId,
						error: error.message,
					},
					"Admin access denied for user",
				);
			} else {
				logger.error(
					{
						userId,
						error: error.message,
						code: error.code,
					},
					"Failed to get auth info for user",
				);
			}
			return {};
		}

		return {
			email: authUser.user?.email,
			last_sign_in_at: authUser.user?.last_sign_in_at,
			email_confirmed_at: authUser.user?.email_confirmed_at,
		};
	} catch (error) {
		logger.error(
			{
				userId,
				error: error instanceof Error ? error.message : String(error),
			},
			"Error getting auth info for user",
		);
		return {};
	}
}

/**
 * 複数ユーザーの認証情報を一括取得
 * 注意: この関数を呼び出す前に、呼び出し元で管理者権限をチェックすること
 */
export async function getAllUsersAuthInfo(userIds: string[]): Promise<Record<string, UserAuthInfo>> {
	const supabase = await createClient();
	const result: Record<string, UserAuthInfo> = {};

	// 既定では各ユーザーを空情報で埋めておき、取得できたものだけ上書きする。
	for (const id of userIds) {
		result[id] = {};
	}
	if (userIds.length === 0) {
		return result;
	}

	try {
		// id で絞り込む SECURITY DEFINER RPC で auth 情報を一括取得。
		// listUsers() は先頭ページのみを返し、かつ admin API はサービスロールを要するため
		// ユーザーセッションでは取得漏れ/失敗し得る。本RPCは auth ページングに依存しない。
		// 注: get_admin_auth_user_details_by_ids は
		//   20260608000003_add_admin_sorted_page_rpcs.sql で追加。
		const { data, error } = await (
			supabase.rpc as unknown as (
				fn: string,
				args: unknown,
			) => PromiseLike<{ data: unknown; error: { message: string } | null }>
		)("get_admin_auth_user_details_by_ids", { p_user_ids: userIds });

		if (error) {
			logger.error(
				{
					error: error.message,
					userIdsCount: userIds.length,
				},
				"Failed to get all users auth info",
			);
			return result;
		}

		const rows = (data ?? []) as Array<{
			id: string;
			email: string | null;
			last_sign_in_at: string | null;
			email_confirmed_at: string | null;
		}>;

		for (const row of rows) {
			result[row.id] = {
				email: row.email ?? undefined,
				last_sign_in_at: row.last_sign_in_at ?? undefined,
				email_confirmed_at: row.email_confirmed_at ?? undefined,
			};
		}

		return result;
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				userIdsCount: userIds.length,
			},
			"Error getting all users auth info",
		);
		return result;
	}
}
