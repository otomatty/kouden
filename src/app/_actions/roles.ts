"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface KoudenRole {
	id: string;
	name: string;
}

/**
 * 香典帳のロールを取得
 */
export async function getKoudenRoles(koudenId: string): Promise<KoudenRole[]> {
	const supabase = await createClient();

	const { data: roles, error } = await supabase
		.from("kouden_roles")
		.select("id, name")
		.eq("kouden_id", koudenId)
		.in("name", ["編集者", "閲覧者"]);

	if (error) {
		console.error("[ERROR] Error fetching roles:", error);
		throw new Error("ロール情報の取得に失敗しました");
	}

	return roles;
}

/**
 * 管理者用: 香典帳のロールを取得
 */
export async function getKoudenRolesForAdmin(koudenId: string): Promise<KoudenRole[]> {
	// 管理者権限をチェック
	const { isAdmin } = await import("@/app/_actions/admin/permissions");
	const adminCheck = await isAdmin();
	if (!adminCheck) {
		throw new Error("管理者権限が必要です");
	}

	// 管理者用クライアント（RLSバイパス）を使用
	const { createAdminClient } = await import("@/lib/supabase/admin");
	const supabase = createAdminClient();

	const { data: roles, error } = await supabase
		.from("kouden_roles")
		.select("id, name")
		.eq("kouden_id", koudenId)
		.in("name", ["編集者", "閲覧者"]);

	if (error) {
		console.error("[ERROR] Error fetching roles for admin:", error);
		throw new Error("ロール情報の取得に失敗しました");
	}

	return roles;
}

/**
 * メンバーのロールを更新
 */
export async function updateMemberRole(koudenId: string, userId: string, roleId: string) {
	const supabase = await createClient();

	const { error } = await supabase.rpc("update_member_role", {
		p_kouden_id: koudenId,
		p_user_id: userId,
		p_role_id: roleId,
	});

	if (error) {
		console.error("Failed to update member role:", error);
		throw new Error("メンバーのロール更新に失敗しました");
	}

	revalidatePath(`/koudens/${koudenId}/members`);
}

/**
 * メンバーを削除
 */
export async function removeMember(koudenId: string, userId: string) {
	const supabase = await createClient();

	const { error } = await supabase.rpc("remove_member", {
		p_kouden_id: koudenId,
		p_user_id: userId,
	});

	if (error) {
		console.error("Failed to remove member:", error);
		throw new Error("メンバーの削除に失敗しました");
	}

	revalidatePath(`/koudens/${koudenId}/members`);
}
