import { ErrorCodes, KoudenError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * 管理画面向け: Auth ユーザーの一括解決ヘルパー
 *
 * `supabase.auth.admin.getUserById` を 1 件ずつ呼ぶと N+1 になる。
 * また `listUsers()` の全ページ走査は全ユーザー数 N に比例（O(N)）し、
 * 指定 id が後方ページにある場合に無駄なページングが発生する。
 *
 * そこで専用 RPC `get_auth_users_by_ids` で `auth.users` を id で絞り込み、
 * 対象 id 数 M に比例（O(M)）した 1 クエリで email を一括取得する。
 *
 * 注意:
 *   - RPC は SECURITY DEFINER + 内部で `is_admin(auth.uid())` を強制するため、
 *     呼び出し元はユーザーセッションのクライアント経由で利用すること
 *     （呼び出し元で別途管理者権限を担保していること）。
 */
export interface AuthUserInfo {
	id: string;
	email: string;
}

/**
 * 指定した user_id 群に対応する Auth ユーザー情報を一括取得して Map で返す。
 * 見つからなかった id（削除済みユーザー等）はマップに含まれない。
 * RPC 自体が失敗した場合は、ブランクで握りつぶさず例外を送出する。
 */
export async function getAuthUsersByIds(
	userIds: Array<string | null | undefined>,
): Promise<Map<string, AuthUserInfo>> {
	const map = new Map<string, AuthUserInfo>();

	// 解決が必要な一意な id 集合
	const targetIds = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))));
	if (targetIds.length === 0) {
		return map;
	}

	const supabase = await createClient();

	// 注: get_auth_users_by_ids は 20260608000001_add_get_auth_users_by_ids_rpc.sql で追加。
	// マイグレーション適用後に `bun run db:types` を実行すれば、ここのキャストは不要になる。
	const { data, error } = await (
		supabase.rpc as unknown as (
			fn: string,
			args: unknown,
		) => PromiseLike<{
			data: Array<{ id: string; email: string | null }> | null;
			error: { message: string } | null;
		}>
	)("get_auth_users_by_ids", { p_user_ids: targetIds });

	if (error) {
		throw new KoudenError(
			`Failed to fetch auth users: ${error.message}`,
			ErrorCodes.DB_FETCH_ERROR,
		);
	}

	for (const row of data ?? []) {
		map.set(row.id, { id: row.id, email: row.email ?? "" });
	}

	return map;
}
