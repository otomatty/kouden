"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { KoudenRole } from "@/types/role";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { requireKoudenOwner } from "./permissions";

/**
 * 香典帳のロールを取得（キャッシュ対応）
 * @param koudenId 香典帳ID
 * @returns ロール一覧
 */
export const getKoudenRoles = cache(
	async (koudenId: string): Promise<ActionResult<KoudenRole[]>> => {
		return withActionResult(async () => {
			const supabase = await createClient();
			const { data: roles, error } = await supabase
				.from("kouden_roles")
				.select("id, name")
				.eq("kouden_id", koudenId)
				.in("name", ["編集者", "閲覧者"])
				.order("name");

			if (error) throw error;

			return roles || [];
		}, "ロール一覧の取得");
	},
);

/**
 * 管理者用: 香典帳のロールを取得
 * @param koudenId 香典帳ID
 * @returns ロール一覧
 */
export const getKoudenRolesForAdmin = cache(
	async (koudenId: string): Promise<ActionResult<KoudenRole[]>> => {
		return withActionResult(async () => {
			// 管理者権限をチェック
			const { isAdmin } = await import("@/app/_actions/admin/permissions");
			const adminCheck = await isAdmin();
			if (!adminCheck) {
				throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
			}

			// 管理者用クライアント（RLSバイパス）を使用
			const { createAdminClient } = await import("@/lib/supabase/admin");
			const supabase = createAdminClient();

			const { data: roles, error } = await supabase
				.from("kouden_roles")
				.select("id, name")
				.eq("kouden_id", koudenId)
				.in("name", ["編集者", "閲覧者"])
				.order("name");

			if (error) throw error;

			return roles || [];
		}, "管理者用ロール一覧の取得");
	},
);

/**
 * メンバーのロールを更新
 * @param koudenId 香典帳ID
 * @param userId ユーザーID
 * @param roleId ロールID
 */
export async function updateMemberRole(
	koudenId: string,
	userId: string,
	roleId: string,
): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		await requireKoudenOwner(koudenId);

		// オーナーのロールを変更しようとしていないかチェック
		const { data: kouden } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", koudenId)
			.single();

		if (kouden?.owner_id === userId) {
			throw new KoudenError("オーナーのロールは変更できません", ErrorCodes.INVALID_OPERATION);
		}

		// RPC関数を使用してロールを更新
		const { error } = await supabase.rpc("update_member_role", {
			p_kouden_id: koudenId,
			p_user_id: userId,
			p_role_id: roleId,
		});

		if (error) throw error;

		// キャッシュを更新
		revalidatePath(`/koudens/${koudenId}/members`);
		revalidatePath(`/koudens/${koudenId}`);
		return null;
	}, "メンバーロールの更新");
}

/**
 * メンバーを削除
 * @param koudenId 香典帳ID
 * @param userId ユーザーID
 */
export async function removeMember(koudenId: string, userId: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		await requireKoudenOwner(koudenId);

		// オーナーが自身を削除しようとしていないかチェック
		const { data: kouden } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", koudenId)
			.single();

		if (kouden?.owner_id === userId) {
			throw new KoudenError("オーナーは削除できません", ErrorCodes.INVALID_OPERATION);
		}

		// RPC関数を使用してメンバーを削除
		const { error } = await supabase.rpc("remove_member", {
			p_kouden_id: koudenId,
			p_user_id: userId,
		});

		if (error) throw error;

		// キャッシュを更新
		revalidatePath(`/koudens/${koudenId}/members`);
		revalidatePath(`/koudens/${koudenId}`);
		return null;
	}, "メンバーの削除");
}

/**
 * 自分自身を香典帳から退出させる
 * @param koudenId 香典帳ID
 */
export async function leaveMember(koudenId: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// 現在のユーザーを取得
		const { getCurrentUser } = await import("./auth");
		const currentUser = await getCurrentUser();

		if (!currentUser) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}

		// オーナーが自身を退出しようとしていないかチェック
		const { data: kouden } = await supabase
			.from("koudens")
			.select("owner_id")
			.eq("id", koudenId)
			.single();

		if (kouden?.owner_id === currentUser.id) {
			throw new KoudenError(
				"オーナーは香典帳から退出できません。香典帳を削除するか、他のメンバーにオーナー権限を移譲してください。",
				ErrorCodes.INVALID_OPERATION,
			);
		}

		// 自分がこの香典帳のメンバーかどうか確認
		const { data: memberExists } = await supabase
			.from("kouden_members")
			.select("id")
			.eq("kouden_id", koudenId)
			.eq("user_id", currentUser.id)
			.single();

		if (!memberExists) {
			throw new KoudenError("この香典帳のメンバーではありません", ErrorCodes.NOT_FOUND);
		}

		// RPC関数を使用して自分自身を削除
		const { error } = await supabase.rpc("remove_member", {
			p_kouden_id: koudenId,
			p_user_id: currentUser.id,
		});

		if (error) throw error;

		// キャッシュを更新
		revalidatePath(`/koudens/${koudenId}/members`);
		revalidatePath(`/koudens/${koudenId}`);
		revalidatePath("/koudens"); // 香典帳一覧も更新
		return null;
	}, "香典帳からの退出");
}
