"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { escapeIlikePattern } from "@/lib/security/search-sanitize";
import { createClient } from "@/lib/supabase/server";
import { getAllUsersAuthInfo } from "./auth-info";
import type { GetUsersParams, UserListItem } from "./types";

/**
 * 全ユーザー一覧を取得（Admin API使用）
 */
export async function getAllUsers(params: GetUsersParams = {}): Promise<
	ActionResult<{
		users: UserListItem[];
		total: number;
		hasMore: boolean;
	}>
> {
	return withActionResult(async () => {
		// 管理者権限をチェック（入り口で1回だけ）
		const { isAdmin: isAdminUser } = await import("@/app/_actions/admin/permissions");
		const adminCheck = await isAdminUser();
		if (!adminCheck) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		const supabase = await createClient();
		const {
			page = 1,
			limit = 20,
			search,
			filter,
			sortBy = "created_at",
			sortOrder = "desc",
		} = params;
		const offset = (page - 1) * limit;

		// profilesの基本情報とページ全体の総件数。
		// last_sign_in_at ソートのみ DB 側で全件ソート + ページネーションするため別経路。
		type ProfileRow = {
			id: string;
			display_name: string;
			avatar_url: string | null;
			created_at: string;
			updated_at: string;
		};
		let profiles: ProfileRow[];
		let count: number;

		if (sortBy === "last_sign_in_at") {
			// last_sign_in_at は auth.users 由来の計算列のため、JS側で現ページ内だけを
			// 並べ替えると全件ソートにならない。DB 側 (RPC) で auth.users を結合して
			// 全件ソート + ページネーションし、正しい順序の user_id と全件数を取得する。
			// 注: get_admin_user_ids_by_last_sign_in は
			//   20260608000003_add_admin_sorted_page_rpcs.sql で追加。
			const orderedResult = await (
				supabase.rpc as unknown as (
					fn: string,
					args: unknown,
				) => PromiseLike<{ data: unknown; error: { message: string } | null }>
			)("get_admin_user_ids_by_last_sign_in", {
				p_search: search ? escapeIlikePattern(search) : null,
				p_filter: filter ?? "all",
				p_sort_order: sortOrder,
				p_limit: limit,
				p_offset: offset,
			});

			if (orderedResult.error) {
				throw new KoudenError(
					`Failed to fetch sorted user ids: ${orderedResult.error.message}`,
					ErrorCodes.DB_FETCH_ERROR,
				);
			}

			// RPC は全件数を常に返す（ページが空でも id = NULL のセンチネル行で total_count
			// を返す）。total はページ行に依存せず先頭行の total_count から読み、順序付き ID は
			// id = NULL を除外して組み立てる。
			const orderedRows = (orderedResult.data ?? []) as Array<{
				id: string | null;
				total_count: number | string;
			}>;
			count = Number(orderedRows[0]?.total_count ?? 0);

			const orderedIds = orderedRows.map((row) => row.id).filter((id): id is string => id !== null);

			if (orderedIds.length === 0) {
				return { users: [], total: count, hasMore: false };
			}
			const { data: fetchedProfiles, error: profilesError } = await supabase
				.from("profiles")
				.select("id, display_name, avatar_url, created_at, updated_at")
				.in("id", orderedIds);
			if (profilesError) throw profilesError;

			// RPC が返したソート順を保持して並べ直す（.in() は順序を保証しないため）
			const profileMap = new Map((fetchedProfiles ?? []).map((p) => [p.id, p]));
			profiles = orderedIds
				.map((id) => profileMap.get(id))
				.filter((p): p is ProfileRow => p !== undefined);
		} else {
			// 1. まずprofilesテーブルから基本情報を取得
			let query = supabase.from("profiles").select(
				`
        id,
        display_name,
        avatar_url,
        created_at,
        updated_at
      `,
				{ count: "exact" },
			);

			// 検索条件 (ILIKE のワイルドカード % _ は意図しない一致を生むためエスケープ)
			if (search) {
				query = query.ilike("display_name", `%${escapeIlikePattern(search)}%`);
			}

			// フィルタリング
			if (filter === "admin") {
				const { data: adminUserIds } = await supabase.from("admin_users").select("user_id");

				if (adminUserIds && adminUserIds.length > 0) {
					query = query.in(
						"id",
						adminUserIds.map((admin) => admin.user_id),
					);
				} else {
					// 管理者が存在しない場合は空の結果を返す
					return { users: [], total: 0, hasMore: false };
				}
			} else if (filter === "regular") {
				const { data: adminUserIds } = await supabase.from("admin_users").select("user_id");

				if (adminUserIds && adminUserIds.length > 0) {
					query = query.not(
						"id",
						"in",
						adminUserIds.map((admin) => admin.user_id),
					);
				}
			}

			// ソート
			query = query.order(sortBy, { ascending: sortOrder === "asc" });

			// ページネーション
			query = query.range(offset, offset + limit - 1);

			const { data: fetchedProfiles, error: profilesError, count: fetchedCount } = await query;
			if (profilesError) throw profilesError;

			if (!fetchedProfiles || fetchedProfiles.length === 0) {
				return { users: [], total: fetchedCount || 0, hasMore: false };
			}

			profiles = fetchedProfiles;
			count = fetchedCount || 0;
		}

		// 2. 認証情報と集計統計をそれぞれ1クエリで一括取得（N+1解消）
		const userIds = profiles.map((p) => p.id);
		// 注: get_users_aggregate_stats は 20260513000000_add_get_users_aggregate_stats_rpc.sql で追加。
		// マイグレーション適用後に `bun run db:types` を実行すれば、ここのキャストは不要になる。
		const [authInfoMap, aggregateResult] = await Promise.all([
			getAllUsersAuthInfo(userIds),
			(
				supabase.rpc as unknown as (
					fn: string,
					args: unknown,
				) => PromiseLike<{ data: unknown; error: { message: string } | null }>
			)("get_users_aggregate_stats", { p_user_ids: userIds }),
		]);

		if (aggregateResult.error) {
			// 失敗時は0埋めで継続せず、明示的に例外を投げる（admin UIで誤った0統計を出さないため）
			throw new KoudenError(
				`Failed to fetch user aggregate stats: ${aggregateResult.error.message}`,
				ErrorCodes.DB_FETCH_ERROR,
			);
		}

		type AggregateRow = {
			user_id: string;
			owned_koudens_count: number | string;
			participated_koudens_count: number | string;
			total_entries_count: number | string;
			admin_role: string | null;
			admin_created_at: string | null;
		};
		const aggregateRows = (aggregateResult.data ?? []) as AggregateRow[];
		const aggregateMap = new Map(aggregateRows.map((row) => [row.user_id, row]));

		const usersWithDetails = profiles.map((profile) => {
			const agg = aggregateMap.get(profile.id);
			return {
				...profile,
				stats: {
					owned_koudens_count: Number(agg?.owned_koudens_count ?? 0),
					participated_koudens_count: Number(agg?.participated_koudens_count ?? 0),
					total_entries_count: Number(agg?.total_entries_count ?? 0),
				},
				admin_info: agg?.admin_role
					? {
							role: agg.admin_role as "admin" | "super_admin",
							granted_at: agg.admin_created_at ?? "",
						}
					: undefined,
			};
		});

		// 認証情報をマージ
		// 並び順は profiles の順序（通常パスはクエリ、last_sign_in_at パスは RPC で
		// 全件ソート済み）をそのまま保持するため、ここでの再ソートは不要。
		const finalUsersWithDetails = usersWithDetails.map((user) => ({
			...user,
			...authInfoMap[user.id],
		}));

		return {
			users: finalUsersWithDetails,
			total: count,
			hasMore: count > offset + limit,
		};
	}, "ユーザー一覧の取得");
}
