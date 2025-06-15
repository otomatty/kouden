"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * 管理者権限をチェックする
 * 権限がない場合はエラーを投げる
 */
export async function checkAdminPermission() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	// admin_usersテーブルを直接チェック
	const { data: adminUser, error } = await supabase
		.from("admin_users")
		.select("role")
		.eq("user_id", user.id)
		.single();

	if (error && error.code !== "PGRST116") {
		console.error("Admin permission check error:", error);
		throw new Error("管理者権限の確認に失敗しました");
	}

	if (!adminUser) {
		console.warn(`User ${user.id} is not registered as admin in admin_users table`);
		throw new Error("管理者権限が必要です");
	}

	console.log(`Admin access granted for user ${user.id} with role: ${adminUser.role}`);

	return { supabase, user, adminRole: adminUser.role };
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

	const { data: adminUser } = await supabase
		.from("admin_users")
		.select("role")
		.eq("user_id", user.id)
		.single();

	if (!adminUser || adminUser.role !== "super_admin") {
		throw new Error("スーパー管理者権限が必要です");
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

	// admin_usersテーブルの状態を確認
	const { data: adminUser, error } = await supabase
		.from("admin_users")
		.select("*")
		.eq("user_id", user.id)
		.single();

	// 全ての管理者ユーザーも取得
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
 * 統一された管理者権限チェック関数
 */
export async function isAdmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return false;

	const { data: adminUser, error } = await supabase
		.from("admin_users")
		.select("role")
		.eq("user_id", user.id)
		.single();

	if (error && error.code !== "PGRST116") return false;
	return !!adminUser;
}
