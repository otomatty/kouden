"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import logger from "@/lib/logger";
import { escapeIlikePattern } from "@/lib/security/search-sanitize";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * 全ユーザー管理用の型定義
 */
export interface UserListItem {
	id: string;
	display_name: string;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
	// 認証情報
	email?: string;
	last_sign_in_at?: string;
	email_confirmed_at?: string;
	// 統計情報
	stats: {
		owned_koudens_count: number;
		participated_koudens_count: number;
		total_entries_count: number;
	};
	// 管理者情報
	admin_info?: {
		role: "admin" | "super_admin";
		granted_at: string;
	};
}

export interface UserDetail extends UserListItem {
	// 参加香典帳一覧
	koudens: Array<{
		id: string;
		title: string;
		role: "owner" | "editor" | "viewer";
		joined_at: string;
		last_activity?: string;
	}>;
}

export interface GetUsersParams {
	page?: number;
	limit?: number;
	search?: string;
	filter?: "all" | "admin" | "regular";
	sortBy?: "created_at" | "display_name" | "last_sign_in_at";
	sortOrder?: "asc" | "desc";
}

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
			count = orderedRows.length > 0 ? Number(orderedRows[0].total_count) : 0;

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

/**
 * ユーザー詳細情報を取得
 */
export async function getUserDetail(userId: string): Promise<ActionResult<UserDetail>> {
	return withActionResult(async () => {
		// 管理者権限をチェック（入り口で1回だけ）
		const { isAdmin: isAdminUser } = await import("@/app/_actions/admin/permissions");
		const adminCheck = await isAdminUser();
		if (!adminCheck) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		const supabase = await createClient();

		// 基本情報を取得
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", userId)
			.single();

		if (profileError) throw profileError;
		if (!profile) throw new KoudenError("ユーザーが見つかりません", ErrorCodes.NOT_FOUND);

		// 詳細情報を並列取得
		const [authInfo, stats, adminInfo, koudens] = await Promise.all([
			getUserAuthInfo(userId),
			getUserStats(userId),
			getUserAdminInfo(userId),
			getUserKoudens(userId),
		]);

		return {
			...profile,
			...authInfo,
			stats,
			admin_info: adminInfo,
			koudens,
		};
	}, "ユーザー詳細の取得");
}

/**
 * Admin APIを使用してユーザーの認証情報を取得
 * 注意: この関数を呼び出す前に、呼び出し元で管理者権限をチェックすること
 */
async function getUserAuthInfo(userId: string): Promise<{
	email?: string;
	last_sign_in_at?: string;
	email_confirmed_at?: string;
}> {
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
async function getAllUsersAuthInfo(userIds: string[]): Promise<
	Record<
		string,
		{
			email?: string;
			last_sign_in_at?: string;
			email_confirmed_at?: string;
		}
	>
> {
	const supabase = await createClient();
	const result: Record<
		string,
		{
			email?: string;
			last_sign_in_at?: string;
			email_confirmed_at?: string;
		}
	> = {};

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

/**
 * ユーザーの統計情報を取得
 */
async function getUserStats(userId: string): Promise<{
	owned_koudens_count: number;
	participated_koudens_count: number;
	total_entries_count: number;
}> {
	const supabase = await createClient();

	try {
		// 並列でクエリ実行
		const [ownedKoudens, participatedKoudens, totalEntries] = await Promise.all([
			supabase.from("koudens").select("id", { count: "exact", head: true }).eq("owner_id", userId),
			supabase
				.from("kouden_members")
				.select("id", { count: "exact", head: true })
				.eq("user_id", userId),
			supabase
				.from("kouden_entries")
				.select("id", { count: "exact", head: true })
				.eq("created_by", userId),
		]);

		return {
			owned_koudens_count: ownedKoudens.count || 0,
			participated_koudens_count: participatedKoudens.count || 0,
			total_entries_count: totalEntries.count || 0,
		};
	} catch (error) {
		logger.error(
			{
				userId,
				error: error instanceof Error ? error.message : String(error),
			},
			"Error getting stats for user",
		);
		return {
			owned_koudens_count: 0,
			participated_koudens_count: 0,
			total_entries_count: 0,
		};
	}
}

/**
 * ユーザーの管理者情報を取得
 */
async function getUserAdminInfo(userId: string): Promise<
	| {
			role: "admin" | "super_admin";
			granted_at: string;
	  }
	| undefined
> {
	const supabase = await createClient();

	try {
		const { data: adminInfo, error } = await supabase
			.from("admin_users")
			.select("role, created_at")
			.eq("user_id", userId)
			.single();

		if (error || !adminInfo) return undefined;

		return {
			role: adminInfo.role as "admin" | "super_admin",
			granted_at: adminInfo.created_at || "",
		};
	} catch {
		return undefined;
	}
}

/**
 * ユーザーが参加している香典帳一覧を取得
 */
async function getUserKoudens(userId: string): Promise<
	Array<{
		id: string;
		title: string;
		role: "owner" | "editor" | "viewer";
		joined_at: string;
		last_activity?: string;
	}>
> {
	const supabase = await createClient();

	try {
		// 所有している香典帳（全ステータス）
		const { data: ownedKoudens } = await supabase
			.from("koudens")
			.select("id, title, created_at, updated_at, status")
			.eq("owner_id", userId)
			.order("created_at", { ascending: false });

		// 参加している香典帳（全ステータス）
		const { data: memberKoudens } = await supabase
			.from("kouden_members")
			.select(`
        created_at,
        kouden_id,
        koudens!inner(id, title, updated_at, status),
        kouden_roles!inner(name)
      `)
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		const koudens = [];

		// 所有している香典帳を追加
		if (ownedKoudens) {
			koudens.push(
				...ownedKoudens.map((kouden) => ({
					id: kouden.id,
					title: kouden.title,
					role: "owner" as const,
					joined_at: kouden.created_at,
					last_activity: kouden.updated_at,
					status: kouden.status, // ステータス情報も含める
				})),
			);
		}

		// 参加している香典帳を追加
		if (memberKoudens) {
			koudens.push(
				...memberKoudens.map((member) => ({
					id: member.koudens.id,
					title: member.koudens.title,
					role: member.kouden_roles.name === "editor" ? ("editor" as const) : ("viewer" as const),
					joined_at: member.created_at,
					last_activity: member.koudens.updated_at,
					status: member.koudens.status, // ステータス情報も含める
				})),
			);
		}

		// 重複を除去し、最新順にソート
		const uniqueKoudens = koudens.filter(
			(kouden, index, self) => index === self.findIndex((k) => k.id === kouden.id),
		);

		// ステータス情報を除いて返す（型定義に合わせるため）
		return uniqueKoudens
			.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
			.map(({ status, ...kouden }) => kouden);
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				userId,
			},
			`Error getting koudens for user ${userId}`,
		);
		return [];
	}
}

/**
 * 管理者用: 全香典帳一覧を取得
 */
export interface AdminKoudenListItem {
	id: string;
	title: string;
	description: string | null;
	status: "active" | "archived" | "inactive";
	created_at: string;
	updated_at: string;
	owner: {
		id: string;
		display_name: string;
		avatar_url: string | null;
	};
	plan: {
		id: string;
		code: string;
		name: string;
	};
	stats: {
		entries_count: number;
		members_count: number;
		total_amount: number;
	};
	expired: boolean;
	remainingDays?: number;
}

export interface GetAdminKoudensParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: "all" | "active" | "archived" | "inactive";
	sortBy?: "created_at" | "updated_at" | "title" | "entries_count";
	sortOrder?: "asc" | "desc";
}

/**
 * 管理者用: 全香典帳一覧を取得
 */
export async function getAllKoudens(params: GetAdminKoudensParams = {}): Promise<
	ActionResult<{
		koudens: AdminKoudenListItem[];
		total: number;
		hasMore: boolean;
	}>
> {
	return withActionResult(async () => {
		// 管理者用にサービスロールクライアントを使用（RLSをバイパス）
		const { createAdminClient } = await import("@/lib/supabase/admin");
		const supabase = createAdminClient();
		const {
			page = 1,
			limit = 20,
			search,
			status = "all",
			sortBy = "created_at",
			sortOrder = "desc",
		} = params;
		const offset = (page - 1) * limit;

		// 管理者権限をチェック（通常のクライアントで）
		const { isAdmin: isAdminUser } = await import("@/app/_actions/admin/permissions");
		const adminCheck = await isAdminUser();

		if (!adminCheck) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		// 統計やソート RPC は内部で is_admin(auth.uid()) を検証するため、
		// サービスロールではなくユーザーセッションのクライアントで呼び出す。
		const sessionClient = await createClient();

		const KOUDEN_BASE_SELECT = `
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        owner_id,
        plan_id
      `;
		type KoudenBaseRow = {
			id: string;
			title: string;
			description: string | null;
			status: string;
			created_at: string;
			updated_at: string;
			owner_id: string;
			plan_id: string;
		};

		// 1. 香典帳の基本情報とページ全体の総件数を取得。
		// entries_count ソートのみ DB 側で全件ソート + ページネーションするため別経路。
		let koudens: KoudenBaseRow[];
		let count: number;

		if (sortBy === "entries_count") {
			// entries_count は kouden_entries の集計値（計算列）のため、JS側で現ページ内
			// だけを並べ替えると全件ソートにならない。DB 側 (RPC) で集計を含めて全件ソート +
			// ページネーションし、正しい順序の kouden_id と全件数を取得する。
			// 注: get_admin_kouden_ids_by_entries_count は
			//   20260608000003_add_admin_sorted_page_rpcs.sql で追加。
			const orderedResult = await (
				sessionClient.rpc as unknown as (
					fn: string,
					args: unknown,
				) => PromiseLike<{ data: unknown; error: { message: string } | null }>
			)("get_admin_kouden_ids_by_entries_count", {
				p_search: search ? escapeIlikePattern(search) : null,
				p_status: status,
				p_sort_order: sortOrder,
				p_limit: limit,
				p_offset: offset,
			});

			if (orderedResult.error) {
				throw new KoudenError(
					`Failed to fetch sorted kouden ids: ${orderedResult.error.message}`,
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
			count = orderedRows.length > 0 ? Number(orderedRows[0].total_count) : 0;

			const orderedIds = orderedRows.map((row) => row.id).filter((id): id is string => id !== null);

			if (orderedIds.length === 0) {
				return { koudens: [], total: count, hasMore: false };
			}
			const { data: fetchedKoudens, error: koudensError } = await supabase
				.from("koudens")
				.select(KOUDEN_BASE_SELECT)
				.in("id", orderedIds);
			if (koudensError) throw koudensError;

			// RPC が返したソート順を保持して並べ直す（.in() は順序を保証しないため）
			const koudenMap = new Map((fetchedKoudens ?? []).map((k) => [k.id, k as KoudenBaseRow]));
			koudens = orderedIds
				.map((id) => koudenMap.get(id))
				.filter((k): k is KoudenBaseRow => k !== undefined);
		} else {
			let query = supabase.from("koudens").select(KOUDEN_BASE_SELECT, { count: "exact" });

			// 検索条件 (ILIKE のワイルドカード % _ は意図しない一致を生むためエスケープ)
			if (search) {
				query = query.ilike("title", `%${escapeIlikePattern(search)}%`);
			}

			// ステータスフィルタリング
			if (status !== "all") {
				query = query.eq("status", status);
			}

			// ソート
			query = query.order(sortBy, { ascending: sortOrder === "asc" });

			// ページネーション
			query = query.range(offset, offset + limit - 1);

			const { data: fetchedKoudens, error: koudensError, count: fetchedCount } = await query;
			if (koudensError) throw koudensError;

			if (!fetchedKoudens || fetchedKoudens.length === 0) {
				return { koudens: [], total: fetchedCount || 0, hasMore: false };
			}

			koudens = fetchedKoudens as KoudenBaseRow[];
			count = fetchedCount || 0;
		}

		// 2. オーナー / プラン / 統計を ID 群でまとめて一括取得（N+1解消）
		const ownerIds = Array.from(new Set(koudens.map((k) => k.owner_id)));
		const planIds = Array.from(new Set(koudens.map((k) => k.plan_id)));
		const koudenIds = koudens.map((k) => k.id);

		// 注: get_admin_kouden_stats は 20260608000000_add_get_admin_kouden_stats_rpc.sql で追加。
		// マイグレーション適用後に `bun run db:types` を実行すれば、ここのキャストは不要になる。
		const [ownersResult, plansResult, statsResult] = await Promise.all([
			supabase.from("profiles").select("id, display_name, avatar_url").in("id", ownerIds),
			supabase.from("plans").select("id, code, name").in("id", planIds),
			(
				sessionClient.rpc as unknown as (
					fn: string,
					args: unknown,
				) => PromiseLike<{ data: unknown; error: { message: string } | null }>
			)("get_admin_kouden_stats", { p_kouden_ids: koudenIds }),
		]);

		// 取得エラーはサイレントに「不明」化せず、明示的に例外を投げる
		if (ownersResult.error) {
			throw new KoudenError(
				`Failed to fetch kouden owners: ${ownersResult.error.message}`,
				ErrorCodes.DB_FETCH_ERROR,
			);
		}
		if (plansResult.error) {
			throw new KoudenError(
				`Failed to fetch kouden plans: ${plansResult.error.message}`,
				ErrorCodes.DB_FETCH_ERROR,
			);
		}

		const ownerMap = new Map((ownersResult.data ?? []).map((owner) => [owner.id, owner] as const));
		const planMap = new Map((plansResult.data ?? []).map((plan) => [plan.id, plan] as const));

		if (statsResult.error) {
			// 失敗時は0埋めで継続せず、明示的に例外を投げる（admin UIで誤った0統計を出さないため）
			throw new KoudenError(
				`Failed to fetch kouden aggregate stats: ${statsResult.error.message}`,
				ErrorCodes.DB_FETCH_ERROR,
			);
		}

		type KoudenStatsRow = {
			kouden_id: string;
			entries_count: number | string;
			members_count: number | string;
			total_amount: number | string;
		};
		const statsRows = (statsResult.data ?? []) as KoudenStatsRow[];
		const statsMap = new Map(statsRows.map((row) => [row.kouden_id, row] as const));

		// 取得「全体」の失敗（ownersResult/plansResult/statsResult の error）は上で例外化済み。
		// 以降の ownerMap/planMap/statsMap.get に対するフォールバックは「個別レコードの欠損」
		// （削除済み owner、未登録 plan、エントリー0件の kouden 等）を正常系として扱うもので、
		// owner/plan は「不明」プレースホルダ、stats は 0 埋めで継続する。
		const koudensWithDetails = koudens.map((kouden) => {
			const owner = ownerMap.get(kouden.owner_id) ?? {
				id: kouden.owner_id,
				display_name: "不明",
				avatar_url: null,
			};
			const plan = planMap.get(kouden.plan_id) ?? {
				id: kouden.plan_id,
				code: "unknown",
				name: "不明",
			};
			const statsRow = statsMap.get(kouden.id);
			const stats = {
				entries_count: Number(statsRow?.entries_count ?? 0),
				members_count: Number(statsRow?.members_count ?? 0),
				total_amount: Number(statsRow?.total_amount ?? 0),
			};

			// 無料プランの期限切れ判定
			let expired = false;
			let remainingDays: number | undefined;
			if (plan.code === "free") {
				const ageMs = Date.now() - new Date(kouden.created_at).getTime();
				const ageDays = ageMs / (1000 * 60 * 60 * 24);
				if (ageDays >= 14) {
					expired = true;
					remainingDays = 0;
				} else {
					remainingDays = Math.ceil(14 - ageDays);
				}
			}

			return {
				...kouden,
				status: kouden.status as "active" | "archived" | "inactive",
				owner,
				plan,
				stats,
				expired,
				remainingDays,
			};
		});

		// 並び順は koudens の順序（通常パスはクエリ、entries_count パスは RPC で
		// 全件ソート済み）をそのまま保持するため、ここでの再ソートは不要。
		return {
			koudens: koudensWithDetails,
			total: count,
			hasMore: count > offset + limit,
		};
	}, "香典帳一覧の取得");
}
