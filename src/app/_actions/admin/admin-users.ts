import { type ActionResult, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/types/admin";
import { revalidatePath } from "next/cache";

export async function getAdminUsers(): Promise<ActionResult<AdminUser[]>> {
	return withActionResult(async () => {
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

		return adminUsersWithDetails as AdminUser[];
	}, "管理者ユーザー一覧の取得");
}

export async function addAdminUser(
	userId: string,
	role: "admin" | "super_admin",
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { error } = await supabase.from("admin_users").insert({ user_id: userId, role });

		if (error) throw error;
		revalidatePath("/admin/users");
		return null;
	}, "管理者の追加");
}

export async function updateAdminRole(
	adminId: string,
	role: "admin" | "super_admin",
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { error } = await supabase.from("admin_users").update({ role }).eq("id", adminId);

		if (error) throw error;
		revalidatePath("/admin/users");
		return null;
	}, "管理者ロールの更新");
}

export async function removeAdminUser(adminId: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { error } = await supabase.from("admin_users").delete().eq("id", adminId);

		if (error) throw error;
		revalidatePath("/admin/users");
		return null;
	}, "管理者の削除");
}

export async function isUserAdmin(userId: string): Promise<ActionResult<boolean>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data, error } = await supabase.rpc("is_admin", {
			user_uid: userId,
		});

		if (error) throw error;
		return !!data;
	}, "管理者判定");
}

export async function findUserByEmail(email: string): Promise<ActionResult<unknown>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data: user, error } = await supabase
			.from("profiles")
			.select("id, email, created_at")
			.eq("email", email)
			.single();

		if (error) throw error;
		return user;
	}, "メールでのユーザー検索");
}

// isAdmin関数は permissions.ts に移動しました
// 重複を避けるため、こちらからは削除
