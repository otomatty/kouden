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

		// ソート（last_sign_in_atは後でソートするため、ここではcreated_atでソート）
		const orderBy = sortBy === "last_sign_in_at" ? "created_at" : sortBy;
		query = query.order(orderBy, { ascending: sortOrder === "asc" });

		// ページネーション
		query = query.range(offset, offset + limit - 1);

		const { data: profiles, error: profilesError, count } = await query;
		if (profilesError) throw profilesError;

		if (!profiles || profiles.length === 0) {
			return { users: [], total: count || 0, hasMore: false };
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
		const finalUsersWithDetails = usersWithDetails.map((user) => ({
			...user,
			...authInfoMap[user.id],
		}));

		// last_sign_in_atでソートが指定されている場合はここでソート
		if (sortBy === "last_sign_in_at") {
			finalUsersWithDetails.sort((a, b) => {
				const aLastSignIn = (a as UserListItem).last_sign_in_at;
				const bLastSignIn = (b as UserListItem).last_sign_in_at;
				const aDate = aLastSignIn ? new Date(aLastSignIn).getTime() : 0;
				const bDate = bLastSignIn ? new Date(bLastSignIn).getTime() : 0;
				return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
			});
		}

		return {
			users: finalUsersWithDetails,
			total: count || 0,
			hasMore: (count || 0) > offset + limit,
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

	try {
		// Admin APIで全ユーザーを一括取得
		const { data: users, error } = await supabase.auth.admin.listUsers();

		if (error) {
			logger.error(
				{
					error: error.message,
					code: error.code,
					userIdsCount: userIds.length,
				},
				"Failed to get all users auth info",
			);
			// エラーの場合は空のオブジェクトを各ユーザーに設定
			for (const id of userIds) {
				result[id] = {};
			}
			return result;
		}

		// 必要なユーザーのみフィルタリングしてマップに変換
		const userMap = new Map(users.users.map((user) => [user.id, user]));

		for (const userId of userIds) {
			const user = userMap.get(userId);
			if (user) {
				result[userId] = {
					email: user.email,
					last_sign_in_at: user.last_sign_in_at,
					email_confirmed_at: user.email_confirmed_at,
				};
			} else {
				result[userId] = {};
			}
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
		// エラーの場合は空のオブジェクトを各ユーザーに設定
		for (const id of userIds) {
			result[id] = {};
		}
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

		// 1. 香典帳の基本情報を取得
		let query = supabase.from("koudens").select(
			`
        id,
        title,
        description,
        status,
        created_at,
        updated_at,
        owner_id,
        plan_id
      `,
			{ count: "exact" },
		);

		// 検索条件 (ILIKE のワイルドカード % _ は意図しない一致を生むためエスケープ)
		if (search) {
			query = query.ilike("title", `%${escapeIlikePattern(search)}%`);
		}

		// ステータスフィルタリング
		if (status !== "all") {
			query = query.eq("status", status);
		}

		// ソート（entries_count以外）
		if (sortBy !== "entries_count") {
			query = query.order(sortBy, { ascending: sortOrder === "asc" });
		} else {
			// entries_countでソートする場合は後でソート
			query = query.order("created_at", { ascending: false });
		}

		// ページネーション
		query = query.range(offset, offset + limit - 1);

		const { data: koudens, error: koudensError, count } = await query;

		if (koudensError) throw koudensError;

		if (!koudens || koudens.length === 0) {
			return { koudens: [], total: count || 0, hasMore: false };
		}

		// 2. 各香典帳の詳細情報を並列取得
		const koudensWithDetails = await Promise.all(
			koudens.map(async (kouden) => {
				try {
					// オーナー情報、プラン情報、統計情報を並列取得
					const [owner, plan, stats] = await Promise.all([
						getKoudenOwner(kouden.owner_id),
						getKoudenPlan(kouden.plan_id),
						getKoudenStats(kouden.id),
					]);

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
				} catch (error) {
					logger.error(
						{
							koudenId: kouden.id,
							error: error instanceof Error ? error.message : String(error),
						},
						"Failed to get details for kouden",
					);
					// エラーが発生した場合は基本情報のみ返す
					return {
						...kouden,
						status: kouden.status as "active" | "archived" | "inactive",
						owner: { id: kouden.owner_id, display_name: "不明", avatar_url: null },
						plan: { id: kouden.plan_id, code: "unknown", name: "不明" },
						stats: { entries_count: 0, members_count: 0, total_amount: 0 },
						expired: false,
					};
				}
			}),
		);

		// entries_countでソートが指定されている場合はここでソート
		if (sortBy === "entries_count") {
			koudensWithDetails.sort((a, b) => {
				const aCount = a.stats.entries_count;
				const bCount = b.stats.entries_count;
				return sortOrder === "asc" ? aCount - bCount : bCount - aCount;
			});
		}

		return {
			koudens: koudensWithDetails,
			total: count || 0,
			hasMore: (count || 0) > offset + limit,
		};
	}, "香典帳一覧の取得");
}

/**
 * 香典帳のオーナー情報を取得
 */
async function getKoudenOwner(ownerId: string): Promise<{
	id: string;
	display_name: string;
	avatar_url: string | null;
}> {
	const { createAdminClient } = await import("@/lib/supabase/admin");
	const supabase = createAdminClient();

	const { data: owner, error } = await supabase
		.from("profiles")
		.select("id, display_name, avatar_url")
		.eq("id", ownerId)
		.single();

	if (error || !owner) {
		return { id: ownerId, display_name: "不明", avatar_url: null };
	}

	return owner;
}

/**
 * 香典帳のプラン情報を取得
 */
async function getKoudenPlan(planId: string): Promise<{
	id: string;
	code: string;
	name: string;
}> {
	const { createAdminClient } = await import("@/lib/supabase/admin");
	const supabase = createAdminClient();

	const { data: plan, error } = await supabase
		.from("plans")
		.select("id, code, name")
		.eq("id", planId)
		.single();

	if (error || !plan) {
		return { id: planId, code: "unknown", name: "不明" };
	}

	return plan;
}

/**
 * 香典帳の統計情報を取得
 */
async function getKoudenStats(koudenId: string): Promise<{
	entries_count: number;
	members_count: number;
	total_amount: number;
}> {
	const { createAdminClient } = await import("@/lib/supabase/admin");
	const supabase = createAdminClient();

	try {
		// 並列でクエリ実行
		const [entriesResult, membersResult, totalAmountResult] = await Promise.all([
			supabase
				.from("kouden_entries")
				.select("id", { count: "exact", head: true })
				.eq("kouden_id", koudenId),
			supabase
				.from("kouden_members")
				.select("id", { count: "exact", head: true })
				.eq("kouden_id", koudenId),
			supabase.from("kouden_entries").select("amount").eq("kouden_id", koudenId),
		]);

		// 合計金額を計算
		const totalAmount =
			totalAmountResult.data?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

		return {
			entries_count: entriesResult.count || 0,
			members_count: membersResult.count || 0,
			total_amount: totalAmount,
		};
	} catch (error) {
		logger.error(
			{
				koudenId,
				error: error instanceof Error ? error.message : String(error),
			},
			"Error getting stats for kouden",
		);
		return {
			entries_count: 0,
			members_count: 0,
			total_amount: 0,
		};
	}
}
