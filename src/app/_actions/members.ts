"use server";

import { createClient } from "@/lib/supabase/server";
import type { KoudenMember } from "@/types/member";
import type { KoudenRole } from "@/types/role";
import { isKoudenOwner } from "./permissions";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { KoudenError, withErrorHandling } from "@/lib/errors";

// 香典帳のロール一覧を取得（キャッシュ対応）
export const getKoudenRoles = cache(async (koudenId: string): Promise<KoudenRole[]> => {
	return withErrorHandling(async () => {
		const supabase = await createClient();
		const { data: roles, error } = await supabase
			.from("kouden_roles")
			.select("id, name")
			.eq("kouden_id", koudenId)
			.order("name");

		if (error) {
			throw new KoudenError("ロール一覧の取得に失敗しました", "FETCH_ROLES_ERROR");
		}

		return roles;
	}, "ロール一覧の取得");
});

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
 * メンバー一覧を取得する（最適化版）
 * @param koudenId 香典帳ID
 * @returns メンバー一覧
 */
export const getMembers = cache(async (koudenId: string) => {
	return withErrorHandling(async () => {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new KoudenError("認証が必要です", "UNAUTHORIZED");
		}

		// まず、ユーザーの権限を確認
		const { data: permission, error: permissionError } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", koudenId)
			.single();

		if (permissionError) {
			console.error("[ERROR] Failed to fetch permission:", permissionError);
			throw new KoudenError("権限の確認に失敗しました", "FETCH_PERMISSION_ERROR");
		}

		const isOwner = permission?.owner_id === user.id;

		if (!isOwner) {
			// オーナーでない場合、メンバーかどうかを確認
			const { data: membership, error: membershipError } = await supabase
				.from("kouden_members")
				.select("id")
				.eq("kouden_id", koudenId)
				.eq("user_id", user.id)
				.single();

			if (membershipError) {
				console.error("[ERROR] Failed to check membership:", membershipError);
				throw new KoudenError("メンバー権限の確認に失敗しました", "FETCH_MEMBERSHIP_ERROR");
			}

			if (!membership) {
				throw new KoudenError("アクセス権限がありません", "FORBIDDEN");
			}
		}

		// メンバー一覧とロール情報を取得
		const { data: members, error: membersError } = await supabase
			.from("kouden_members")
			.select(`
				id,
				user_id,
				role_id,
				kouden_roles:kouden_roles (
					id,
					name
				)
			`)
			.eq("kouden_id", koudenId);

		if (membersError) {
			console.error("[ERROR] Failed to fetch members:", membersError);
			throw new KoudenError("メンバー一覧の取得に失敗しました", "FETCH_MEMBERS_ERROR");
		}

		if (!members) {
			return [];
		}

		// プロフィール情報を別途取得
		const userIds = members.map((member) => member.user_id);
		const { data: profiles, error: profilesError } = await supabase
			.from("profiles")
			.select("id, display_name, avatar_url")
			.in("id", userIds);

		if (profilesError) {
			console.error("[ERROR] Failed to fetch profiles:", profilesError);
			throw new KoudenError("プロフィール情報の取得に失敗しました", "FETCH_PROFILES_ERROR");
		}

		// メンバー情報の整形
		return members.map((member) => {
			const isOwnerUser = member.user_id === permission?.owner_id;
			const roleData = Array.isArray(member.kouden_roles) ? member.kouden_roles[0] : null;
			const role = roleData || { id: member.role_id, name: "unknown" };
			const profile = profiles?.find((p) => p.id === member.user_id) || {
				id: member.user_id,
				display_name: "Unknown User",
				avatar_url: null,
			};

			return {
				...member,
				profile,
				isOwner: isOwnerUser,
				role: isOwnerUser
					? {
							id: member.role_id,
							name: "owner",
						}
					: role,
				canUpdateRole: isOwner && !isOwnerUser,
				canDelete: isOwner && !isOwnerUser,
			};
		});
	}, "メンバー一覧の取得");
});

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
