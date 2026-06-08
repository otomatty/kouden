import logger from "@/lib/logger";

/**
 * 管理画面向け: Auth ユーザーの一括解決ヘルパー
 *
 * `supabase.auth.admin.getUserById` を 1 件ずつ呼ぶと N+1 になるため、
 * `listUsers()` で全ユーザーを一括取得し、必要な id だけ Map から引く。
 *
 * 注意:
 *   - サービスロール (`createAdminClient`) を使うため、呼び出し元で
 *     管理者権限をチェックしてから利用すること。
 *   - listUsers はページングされる（既定 perPage=50）。全ページを走査する。
 */
export interface AuthUserInfo {
	id: string;
	email: string;
}

/**
 * 指定した user_id 群に対応する Auth ユーザー情報を一括取得して Map で返す。
 * 見つからなかった id はマップに含まれない。
 */
export async function getAuthUsersByIds(
	userIds: Array<string | null | undefined>,
): Promise<Map<string, AuthUserInfo>> {
	const map = new Map<string, AuthUserInfo>();

	// 解決が必要な一意な id 集合
	const targetIds = new Set(userIds.filter((id): id is string => Boolean(id)));
	if (targetIds.size === 0) {
		return map;
	}

	const { createAdminClient } = await import("@/lib/supabase/admin");
	const supabase = createAdminClient();

	const perPage = 1000;
	let page = 1;

	try {
		while (true) {
			const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
			if (error) {
				logger.error({ error: error.message, code: error.code, page }, "Failed to list auth users");
				break;
			}

			const users = data?.users ?? [];
			for (const user of users) {
				if (targetIds.has(user.id)) {
					map.set(user.id, { id: user.id, email: user.email ?? "" });
				}
			}

			// 必要な id が全て揃った、または最終ページに達したら終了
			if (map.size >= targetIds.size || users.length < perPage) {
				break;
			}
			page += 1;
		}
	} catch (error) {
		logger.error(
			{ error: error instanceof Error ? error.message : String(error) },
			"Error listing auth users",
		);
	}

	return map;
}
