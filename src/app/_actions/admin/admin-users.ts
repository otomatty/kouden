import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AdminUser } from "@/types/admin";

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

export async function addAdminUser(
	userId: string,
	role: "admin" | "super_admin",
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("admin_users")
		.insert({ user_id: userId, role });

	if (error) throw error;
	revalidatePath("/admin/users");
}

export async function updateAdminRole(
	adminId: string,
	role: "admin" | "super_admin",
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("admin_users")
		.update({ role })
		.eq("id", adminId);

	if (error) throw error;
	revalidatePath("/admin/users");
}

export async function removeAdminUser(adminId: string) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("admin_users")
		.delete()
		.eq("id", adminId);

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
	const { data: adminUser, error } = await supabase
		.from("admin_users")
		.select("role")
		.single();

	if (error && error.code !== "PGRST116") throw error;
	return !!adminUser;
}
