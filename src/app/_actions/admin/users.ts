"use server";

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
export async function getAllUsers(params: GetUsersParams = {}): Promise<{
	users: UserListItem[];
	total: number;
	hasMore: boolean;
}> {
	// 管理者権限をチェック（入り口で1回だけ）
	const { isAdmin: isAdminUser } = await import("@/app/_actions/admin/permissions");
	const adminCheck = await isAdminUser();
	if (!adminCheck) {
		throw new Error("管理者権限が必要です");
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

	try {
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

		// 検索条件
		if (search) {
			query = query.ilike("display_name", `%${search}%`);
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

		// 2. 各ユーザーの詳細情報を並列取得（認証情報は一括取得）
		const userIds = profiles.map((p) => p.id);
		const [authInfoMap, usersWithDetails] = await Promise.all([
			getAllUsersAuthInfo(userIds),
			Promise.all(
				profiles.map(async (profile) => {
					try {
						// 統計情報、管理者情報を並列取得
						const [stats, adminInfo] = await Promise.all([
							getUserStats(profile.id),
							getUserAdminInfo(profile.id),
						]);

						return {
							...profile,
							stats,
							admin_info: adminInfo,
						};
					} catch (error) {
						console.error(`Failed to get details for user ${profile.id}:`, error);
						// エラーが発生した場合は基本情報のみ返す
						const stats = await getUserStats(profile.id).catch(() => ({
							owned_koudens_count: 0,
							participated_koudens_count: 0,
							total_entries_count: 0,
						}));

						return {
							...profile,
							stats,
						};
					}
				}),
			),
		]);

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
	} catch (error) {
		console.error("Error fetching users:", error);
		throw new Error("ユーザー一覧の取得に失敗しました");
	}
}

/**
 * ユーザー詳細情報を取得
 */
export async function getUserDetail(userId: string): Promise<UserDetail> {
	// 管理者権限をチェック（入り口で1回だけ）
	const { isAdmin: isAdminUser } = await import("@/app/_actions/admin/permissions");
	const adminCheck = await isAdminUser();
	if (!adminCheck) {
		throw new Error("管理者権限が必要です");
	}

	const supabase = await createClient();

	try {
		// 基本情報を取得
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", userId)
			.single();

		if (profileError) throw profileError;
		if (!profile) throw new Error("ユーザーが見つかりません");

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
	} catch (error) {
		console.error(`Error fetching user detail for ${userId}:`, error);
		throw new Error("ユーザー詳細の取得に失敗しました");
	}
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
				console.warn(`Admin access denied for user ${userId}:`, error.message);
			} else {
				console.error(`Failed to get auth info for user ${userId}:`, error);
			}
			return {};
		}

		return {
			email: authUser.user?.email,
			last_sign_in_at: authUser.user?.last_sign_in_at,
			email_confirmed_at: authUser.user?.email_confirmed_at,
		};
	} catch (error) {
		console.error(`Error getting auth info for user ${userId}:`, error);
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
			console.error("Failed to get all users auth info:", error);
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
		console.error("Error getting all users auth info:", error);
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
		console.error(`Error getting stats for user ${userId}:`, error);
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
		console.error(`Error getting koudens for user ${userId}:`, error);
		return [];
	}
}

// 既存の管理者関連の関数は維持
export async function getAdminUsers() {
	const supabase = await createClient();

	// 1. まず管理者一覧を取得
	const { data: adminUsers, error: adminError } = await supabase
		.from("admin_users")
		.select("*")
		.order("created_at", { ascending: false });

	if (adminError) throw adminError;

	// 2. 各管理者のユーザー情報を取得
	const adminUsersWithDetails = await Promise.all(
		adminUsers.map(async (admin) => {
			const { data: userData, error: userError } = await supabase
				.from("profiles")
				.select("id, display_name, avatar_url, created_at, updated_at")
				.eq("id", admin.user_id)
				.single();

			if (userError) throw userError;

			return {
				...admin,
				user: userData,
			};
		}),
	);

	return adminUsersWithDetails;
}

export async function addAdminUser(userId: string, role: "admin" | "super_admin") {
	const supabase = await createClient();
	const { error } = await supabase.from("admin_users").insert({ user_id: userId, role });

	if (error) throw error;
	revalidatePath("/admin/users");
}

export async function updateAdminRole(adminId: string, role: "admin" | "super_admin") {
	const supabase = await createClient();
	const { error } = await supabase.from("admin_users").update({ role }).eq("id", adminId);

	if (error) throw error;
	revalidatePath("/admin/users");
}

export async function removeAdminUser(adminId: string) {
	const supabase = await createClient();
	const { error } = await supabase.from("admin_users").delete().eq("id", adminId);

	if (error) throw error;
	revalidatePath("/admin/users");
}

export async function isUserAdmin(userId: string) {
	const supabase = await createClient();
	const { data, error } = await supabase.rpc("is_admin", {
		user_uid: userId,
	});

	if (error) throw error;
	return data;
}

export async function findUserByEmail(email: string) {
	const supabase = await createClient();
	const { data: user, error } = await supabase
		.from("profiles")
		.select("id, email, created_at")
		.eq("email", email)
		.single();

	if (error) throw error;
	return user;
}

// isAdmin関数は permissions.ts に統一されました

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
export async function getAllKoudens(params: GetAdminKoudensParams = {}): Promise<{
	koudens: AdminKoudenListItem[];
	total: number;
	hasMore: boolean;
}> {
	// 管理者権限をチェック（通常のクライアントで）

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

	console.log("getAllKoudens called with params:", params);

	try {
		// 管理者権限をチェック（通常のクライアントで）
		const { isAdmin: isAdminUser } = await import("@/app/_actions/admin/permissions");
		const adminCheck = await isAdminUser();
		console.log("Admin check result:", adminCheck);

		if (!adminCheck) {
			console.error("Admin permission denied");
			throw new Error("管理者権限が必要です");
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

		// 検索条件
		if (search) {
			query = query.ilike("title", `%${search}%`);
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
		console.log("Query result:", {
			koudensCount: koudens?.length || 0,
			totalCount: count,
			error: koudensError?.message,
		});

		if (koudensError) {
			console.error("Koudens query error:", koudensError);
			throw new Error(`香典帳の取得に失敗しました: ${koudensError.message}`);
		}

		if (!koudens || koudens.length === 0) {
			console.log("No koudens found, returning empty result");
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
					console.error(`Failed to get details for kouden ${kouden.id}:`, error);
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

		console.log("Returning koudens:", {
			koudensCount: koudensWithDetails.length,
			total: count || 0,
			hasMore: (count || 0) > offset + limit,
		});

		return {
			koudens: koudensWithDetails,
			total: count || 0,
			hasMore: (count || 0) > offset + limit,
		};
	} catch (error) {
		console.error("Error fetching admin koudens:", error);

		// エラーの詳細を含めて再スロー
		if (error instanceof Error) {
			throw new Error(`香典帳一覧の取得に失敗しました: ${error.message}`);
		}
		throw new Error("香典帳一覧の取得に失敗しました（不明なエラー）");
	}
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
		console.error(`Error getting stats for kouden ${koudenId}:`, error);
		return {
			entries_count: 0,
			members_count: 0,
			total_amount: 0,
		};
	}
}
