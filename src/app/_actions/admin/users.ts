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

		// 2. 各ユーザーの詳細情報を並列取得
		const usersWithDetails = await Promise.all(
			profiles.map(async (profile) => {
				try {
					// 認証情報、統計情報、管理者情報を並列取得
					const [authInfo, stats, adminInfo] = await Promise.all([
						getUserAuthInfo(profile.id),
						getUserStats(profile.id),
						getUserAdminInfo(profile.id),
					]);

					return {
						...profile,
						...authInfo,
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
		);

		// last_sign_in_atでソートが指定されている場合はここでソート
		if (sortBy === "last_sign_in_at") {
			usersWithDetails.sort((a, b) => {
				const aLastSignIn = (a as UserListItem).last_sign_in_at;
				const bLastSignIn = (b as UserListItem).last_sign_in_at;
				const aDate = aLastSignIn ? new Date(aLastSignIn).getTime() : 0;
				const bDate = bLastSignIn ? new Date(bLastSignIn).getTime() : 0;
				return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
			});
		}

		return {
			users: usersWithDetails,
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
 */
async function getUserAuthInfo(userId: string): Promise<{
	email?: string;
	last_sign_in_at?: string;
	email_confirmed_at?: string;
}> {
	const supabase = await createClient();

	try {
		// 管理者権限をチェック
		const isAdminUser = await isAdmin();
		if (!isAdminUser) {
			console.warn(`Admin access required to get auth info for user ${userId}`);
			return {};
		}

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
		// 所有している香典帳
		const { data: ownedKoudens } = await supabase
			.from("koudens")
			.select("id, title, created_at, updated_at")
			.eq("owner_id", userId)
			.order("created_at", { ascending: false });

		// 参加している香典帳
		const { data: memberKoudens } = await supabase
			.from("kouden_members")
			.select(`
        created_at,
        kouden_id,
        koudens!inner(id, title, updated_at),
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
				})),
			);
		}

		// 重複を除去し、最新順にソート
		const uniqueKoudens = koudens.filter(
			(kouden, index, self) => index === self.findIndex((k) => k.id === kouden.id),
		);

		return uniqueKoudens.sort(
			(a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime(),
		);
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

export async function isAdmin() {
	const supabase = await createClient();
	const { data: adminUser, error } = await supabase.from("admin_users").select("role").single();

	if (error && error.code !== "PGRST116") throw error;
	return !!adminUser;
}
