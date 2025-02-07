"use server";

import { createClient } from "@/lib/supabase/server";
import type { KoudenMember } from "@/types/member";
import type { KoudenRole } from "@/types/role";
import { isKoudenOwner } from "./permissions";
import { revalidatePath } from "next/cache";

// 香典帳のロール一覧を取得
export async function getKoudenRoles(koudenId: string): Promise<KoudenRole[]> {
	const supabase = await createClient();

	try {
		const { data: roles, error } = await supabase
			.from("kouden_roles")
			.select("id, name")
			.eq("kouden_id", koudenId)
			.order("name");

		if (error) {
			console.error("[ERROR] Failed to fetch kouden roles:", error);
			throw new Error("ロール一覧の取得に失敗しました");
		}

		return roles;
	} catch (error) {
		console.error("[ERROR] Error in getKoudenRoles:", error);
		throw error;
	}
}

// メンバーのロールを更新
export async function updateMemberRole(koudenId: string, userId: string, roleId: string) {
	const supabase = await createClient();

	try {
		// 管理者権限のチェック
		const isOwner = await isKoudenOwner(koudenId);
		if (!isOwner) {
			throw new Error("権限がありません");
		}

		// オーナーのロールを変更しようとしていないかチェック
		const { data: kouden } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", koudenId)
			.single();

		if (kouden?.owner_id === userId) {
			throw new Error("オーナーのロールは変更できません");
		}

		// RPC関数を使用してロールを更新
		const { error } = await supabase.rpc("update_member_role", {
			p_kouden_id: koudenId,
			p_user_id: userId,
			p_role_id: roleId,
		});

		if (error) {
			console.error("[ERROR] Failed to update member role:", error);
			throw new Error("ロールの更新に失敗しました");
		}

		// キャッシュを更新
		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("[ERROR] Error in updateMemberRole:", error);
		throw error;
	}
}

/**
 * メンバー一覧を取得する
 * @param koudenId 香典帳ID
 * @returns メンバー一覧
 */
export async function getMembers(koudenId: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	// まず、ユーザーの権限を確認
	const { data: permission } = await supabase
		.from("koudens")
		.select("owner_id")
		.eq("id", koudenId)
		.single();

	const isOwner = permission?.owner_id === user.id;

	if (!isOwner) {
		// オーナーでない場合、メンバーかどうかを確認
		const { data: membership } = await supabase
			.from("kouden_members")
			.select("id")
			.eq("kouden_id", koudenId)
			.eq("user_id", user.id)
			.single();

		if (!membership) {
			throw new Error("アクセス権限がありません");
		}
	}

	// メンバー一覧を取得
	const { data: members, error } = await supabase
		.from("kouden_members")
		.select(`
			id,
			user_id,
			role_id,
			role:kouden_roles!role_id(
				id,
				name
			)
		`)
		.eq("kouden_id", koudenId);

	if (error) {
		console.error("[ERROR] Failed to fetch members:", error);
		throw new Error("メンバー一覧の取得に失敗しました");
	}

	// プロフィール情報を別途取得
	const userIds = members.map((member) => member.user_id);
	const { data: profiles, error: profileError } = await supabase
		.from("profiles")
		.select("id, display_name, avatar_url")
		.in("id", userIds);

	if (profileError) {
		console.error("[ERROR] Failed to fetch profiles:", profileError);
		throw new Error("プロフィール情報の取得に失敗しました");
	}

	// メンバー情報とプロフィール情報を結合
	return members.map((member) => {
		const isOwnerUser = member.user_id === permission?.owner_id;
		return {
			...member,
			profile: profiles.find((p) => p.id === member.user_id),
			isOwner: isOwnerUser,
			// オーナーの場合、ロール名を"owner"に上書き
			role: isOwnerUser
				? {
						id: member.role_id,
						name: "owner",
					}
				: member.role,
			// オーナーは自身のロールを変更できない、自身を削除できない
			canUpdateRole: isOwner && !isOwnerUser,
			canDelete: isOwner && !isOwnerUser,
		};
	});
}

// メンバーを削除
export async function deleteMember(koudenId: string, userId: string) {
	const supabase = await createClient();

	try {
		// 管理者権限のチェック
		const isOwner = await isKoudenOwner(koudenId);
		if (!isOwner) {
			throw new Error("権限がありません");
		}

		// オーナーが自身を削除しようとしていないかチェック
		const { data: kouden } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", koudenId)
			.single();

		if (kouden?.owner_id === userId) {
			throw new Error("オーナーは削除できません");
		}

		// RPC関数を使用してメンバーを削除
		const { error } = await supabase.rpc("remove_member", {
			p_kouden_id: koudenId,
			p_user_id: userId,
		});

		if (error) {
			console.error("[ERROR] Failed to delete member:", error);
			throw new Error("メンバーの削除に失敗しました");
		}

		// キャッシュを更新
		revalidatePath(`/koudens/${koudenId}`);
	} catch (error) {
		console.error("[ERROR] Error in deleteMember:", error);
		throw error;
	}
}
