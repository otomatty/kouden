"use server";

import { ErrorCodes, KoudenError } from "@/lib/errors";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type AdminMembership = { role: string };

type FetchAdminMembershipResult =
	| { status: "ok"; adminUser: AdminMembership }
	| { status: "not_found" }
	| { status: "db_error"; error: { message: string; code?: string; details?: string } };

export type AdminContext = {
	supabase: Awaited<ReturnType<typeof createClient>>;
	user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>["user"]>;
	adminRole: string;
};

/**
 * admin_users テーブルから管理者登録を取得する（単一実装経路）
 */
async function fetchAdminMembership(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
): Promise<FetchAdminMembershipResult> {
	const { data: adminUser, error } = await supabase
		.from("admin_users")
		.select("role")
		.eq("user_id", userId)
		.single();

	if (error && error.code !== "PGRST116") {
		return {
			status: "db_error",
			error: { message: error.message, code: error.code, details: error.details ?? undefined },
		};
	}

	if (!adminUser) {
		return { status: "not_found" };
	}

	return { status: "ok", adminUser };
}

async function getAuthenticatedUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return { supabase, user };
}

function logAdminMembershipDbError(
	userId: string,
	error: { message: string; code?: string; details?: string },
	context: string,
) {
	logger.error(
		{
			error: error.message,
			code: error.code,
			details: error.details,
			userId,
		},
		context,
	);
}

function resolveAdminContext(
	supabase: Awaited<ReturnType<typeof createClient>>,
	user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>["user"]>,
	membership: FetchAdminMembershipResult,
): AdminContext {
	if (membership.status === "db_error") {
		logAdminMembershipDbError(user.id, membership.error, "Admin permission check error");
		throw new KoudenError("管理者権限の確認に失敗しました", ErrorCodes.DB_FETCH_ERROR);
	}

	if (membership.status === "not_found") {
		throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
	}

	return { supabase, user, adminRole: membership.adminUser.role };
}

/**
 * Server Component / redirect 向けの管理者ゲート
 * 未認証はログインへ、非管理者はトップへリダイレクトする
 */
export async function requireAdmin(): Promise<AdminContext> {
	const { supabase, user } = await getAuthenticatedUser();

	if (!user) {
		redirect("/auth/login");
	}

	const membership = await fetchAdminMembership(supabase, user.id);

	if (membership.status === "db_error") {
		logAdminMembershipDbError(user.id, membership.error, "Admin permission check error");
		throw new KoudenError("管理者権限の確認に失敗しました", ErrorCodes.DB_FETCH_ERROR);
	}

	if (membership.status === "not_found") {
		logger.warn({ userId: user.id }, `User ${user.id} is not registered as admin in admin_users table`);
		redirect("/");
	}

	logger.info(
		{ userId: user.id, role: membership.adminUser.role },
		`Admin access granted for user ${user.id} with role: ${membership.adminUser.role}`,
	);

	return { supabase, user, adminRole: membership.adminUser.role };
}

/**
 * Server Action / ActionResult 向けの管理者ゲート
 * リダイレクトではなく KoudenError を throw する
 */
export async function assertAdminForAction(): Promise<AdminContext> {
	const { supabase, user } = await getAuthenticatedUser();

	if (!user) {
		throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
	}

	const membership = await fetchAdminMembership(supabase, user.id);
	return resolveAdminContext(supabase, user, membership);
}

/**
 * 管理者権限をチェックする
 * @deprecated {@link requireAdmin} または {@link assertAdminForAction} を使用してください
 */
export async function checkAdminPermission(): Promise<AdminContext> {
	const { supabase, user } = await getAuthenticatedUser();

	if (!user) {
		redirect("/auth/login");
	}

	const membership = await fetchAdminMembership(supabase, user.id);

	if (membership.status === "db_error") {
		logAdminMembershipDbError(user.id, membership.error, "Admin permission check error");
		throw new KoudenError("管理者権限の確認に失敗しました", ErrorCodes.DB_FETCH_ERROR);
	}

	if (membership.status === "not_found") {
		logger.warn({ userId: user.id }, `User ${user.id} is not registered as admin in admin_users table`);
		throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
	}

	logger.info(
		{ userId: user.id, role: membership.adminUser.role },
		`Admin access granted for user ${user.id} with role: ${membership.adminUser.role}`,
	);

	return { supabase, user, adminRole: membership.adminUser.role };
}

/**
 * スーパー管理者権限をチェックする
 * 権限がない場合はエラーを投げる
 */
export async function checkSuperAdminPermission() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	const membership = await fetchAdminMembership(supabase, user.id);

	if (membership.status === "db_error") {
		logAdminMembershipDbError(user.id, membership.error, "Super admin permission check error");
		throw new KoudenError("スーパー管理者権限の確認に失敗しました", ErrorCodes.DB_FETCH_ERROR, {
			cause: membership.error,
		});
	}

	if (membership.status === "not_found" || membership.adminUser.role !== "super_admin") {
		throw new KoudenError("スーパー管理者権限が必要です", ErrorCodes.FORBIDDEN);
	}

	return { supabase, user };
}

/**
 * デバッグ用: 現在のユーザーの管理者状態を確認
 */
export async function debugAdminStatus() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "ユーザーが認証されていません" };
	}

	const { data: adminUser, error } = await supabase
		.from("admin_users")
		.select("*")
		.eq("user_id", user.id)
		.single();

	const { data: allAdmins, error: allAdminsError } = await supabase.from("admin_users").select("*");

	return {
		currentUser: {
			id: user.id,
			email: user.email,
		},
		adminRecord: adminUser,
		adminError: error,
		allAdmins: allAdmins,
		allAdminsError: allAdminsError,
	};
}

/**
 * 現在のユーザーが管理者かどうかをチェックする
 */
export async function isAdmin() {
	const { supabase, user } = await getAuthenticatedUser();

	if (!user) return false;

	const membership = await fetchAdminMembership(supabase, user.id);
	if (membership.status === "db_error") return false;
	return membership.status === "ok";
}
