"use server";

import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { KoudenError, withErrorHandling } from "@/lib/errors";

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

		// メンバー一覧とロール情報を取得（外部キー参照を使用）
		const { data: members, error: membersError } = await supabase
			.from("kouden_members")
			.select(`
				id,
				kouden_id,
				user_id,
				role_id,
				created_at,
				updated_at,
				added_by,
				invitation_id,
				kouden_roles!role_id (
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
			// 外部キー参照の結果を適切に処理
			const roleData = member.kouden_roles;
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

/**
 * 管理者用: メンバー一覧を取得する
 * @param koudenId 香典帳ID
 * @returns メンバー一覧
 */
export const getMembersForAdmin = cache(async (koudenId: string) => {
	return withErrorHandling(async () => {
		// 管理者権限をチェック
		const { isAdmin } = await import("@/app/_actions/admin/permissions");
		const adminCheck = await isAdmin();
		if (!adminCheck) {
			throw new KoudenError("管理者権限が必要です", "UNAUTHORIZED");
		}

		// 管理者用クライアント（RLSバイパス）を使用
		const { createAdminClient } = await import("@/lib/supabase/admin");
		const supabase = createAdminClient();

		// 香典帳の基本情報を取得
		const { data: kouden, error: koudenError } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", koudenId)
			.single();

		if (koudenError) {
			console.error("[ERROR] Failed to fetch kouden:", koudenError);
			throw new KoudenError("香典帳の取得に失敗しました", "FETCH_KOUDEN_ERROR");
		}

		if (!kouden) {
			throw new KoudenError("香典帳が見つかりません", "NOT_FOUND");
		}

		// メンバー一覧とロール情報を取得（外部キー参照を使用）
		const { data: members, error: membersError } = await supabase
			.from("kouden_members")
			.select(`
				id,
				kouden_id,
				user_id,
				role_id,
				created_at,
				updated_at,
				added_by,
				invitation_id,
				kouden_roles!role_id (
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

		// メンバー情報の整形（管理者は全て閲覧可能だが編集権限は制限）
		return members.map((member) => {
			const isOwnerUser = member.user_id === kouden.owner_id;
			// 外部キー参照の結果を適切に処理
			const roleData = member.kouden_roles;
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
				// 管理者は閲覧のみ可能（編集権限は制限）
				canUpdateRole: false,
				canDelete: false,
			};
		});
	}, "管理者用メンバー一覧の取得");
});
