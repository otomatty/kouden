"use server";

import { createClient } from "@/lib/supabase/server";
import type { KoudenPermission, KoudenRole } from "@/types/role";
import { cache } from "react";
import { KoudenError } from "@/lib/errors";

// 権限チェックのユーティリティ関数
export const withPermissionCheck = async <T>(
	koudenId: string,
	requiredPermission: KoudenPermission,
	action: () => Promise<T>,
): Promise<T> => {
	const permission = await checkKoudenPermission(koudenId);
	const hasPermission =
		permission === requiredPermission ||
		permission === "owner" ||
		(permission === "editor" && requiredPermission === "viewer");

	if (!hasPermission) {
		throw new KoudenError("権限がありません", "INSUFFICIENT_PERMISSION");
	}
	return action();
};

// 権限チェック関数（キャッシュ対応）
export const checkKoudenPermission = cache(async (koudenId: string): Promise<KoudenPermission> => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new KoudenError("認証が必要です", "UNAUTHORIZED");
	}

	// オーナーチェックとメンバーロールチェックを1回のクエリで実行
	const { data, error } = await supabase
		.from("koudens")
		.select(`
			owner_id,
			created_by,
			members:kouden_members!inner(
				role_id,
				roles:kouden_roles!inner(
					name
				)
			)
		`)
		.eq("id", koudenId)
		.eq("kouden_members.user_id", user.id)
		.single();

	if (error) {
		throw new KoudenError("権限の取得に失敗しました", "FETCH_PERMISSION_ERROR");
	}

	if (!data) {
		throw new KoudenError("アクセス権限がありません", "FORBIDDEN");
	}

	// オーナーチェック
	if (data.owner_id === user.id || data.created_by === user.id) {
		return "owner";
	}

	// ロール名の変換
	const roleName = data.members[0]?.roles?.name;
	if (roleName === "editor") return "editor";
	if (roleName === "viewer") return "viewer";

	throw new KoudenError("不明な権限です", "UNKNOWN_PERMISSION");
});

// 管理者権限チェック関数（キャッシュ対応）
export const isKoudenOwner = cache(async (koudenId: string): Promise<boolean> => {
	try {
		const permission = await checkKoudenPermission(koudenId);
		return permission === "owner";
	} catch {
		return false;
	}
});

/**
 * 編集権限チェック関数（キャッシュ対応）
 * @param koudenId 香典帳ID
 * @returns 編集権限がある場合はtrue
 */
export const hasEditPermission = cache(async (koudenId: string): Promise<boolean> => {
	try {
		const permission = await checkKoudenPermission(koudenId);
		return permission === "owner" || permission === "editor";
	} catch {
		return false;
	}
});

/**
 * ユーザーが香典帳にアクセスできるか確認
 * @param koudenId 香典帳ID
 * @returns アクセス可能な場合はtrue
 */
export async function canAccessKouden(koudenId: string): Promise<boolean> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return false;

	const { data: kouden } = await supabase
		.from("koudens")
		.select("owner_id")
		.eq("id", koudenId)
		.single();

	if (kouden?.owner_id === user.id) return true;

	const { data: member } = await supabase
		.from("kouden_members")
		.select("id")
		.eq("kouden_id", koudenId)
		.eq("user_id", user.id)
		.single();

	return !!member;
}

/**
 * ユーザーが香典帳を編集できるか確認
 * @param koudenId 香典帳ID
 * @returns 編集可能な場合はtrue
 */
export async function canEditKouden(koudenId: string): Promise<boolean> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return false;

	const { data: kouden } = await supabase
		.from("koudens")
		.select("owner_id")
		.eq("id", koudenId)
		.single();

	if (kouden?.owner_id === user.id) return true;

	const { data: member } = await supabase
		.from("kouden_members")
		.select("role_id")
		.eq("kouden_id", koudenId)
		.eq("user_id", user.id)
		.single();

	if (!member) return false;

	const { data: role } = await supabase
		.from("kouden_roles")
		.select("name")
		.eq("id", member.role_id)
		.single();

	return role?.name === "editor";
}

/**
 * ユーザーが香典帳を削除できるか確認
 * @param koudenId 香典帳ID
 * @returns 削除可能な場合はtrue
 */
export async function canDeleteKouden(koudenId: string): Promise<boolean> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return false;

	const { data: kouden } = await supabase
		.from("koudens")
		.select("owner_id")
		.eq("id", koudenId)
		.single();

	return kouden?.owner_id === user.id;
}

/**
 * ユーザーの香典帳に対するロールを取得
 * @param koudenId 香典帳ID
 * @returns ロール名
 */
export async function getKoudenRole(koudenId: string): Promise<KoudenPermission | null> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return null;

	const { data: kouden } = await supabase
		.from("koudens")
		.select("owner_id")
		.eq("id", koudenId)
		.single();

	if (kouden?.owner_id === user.id) return "owner" as KoudenPermission;

	const { data: member } = await supabase
		.from("kouden_members")
		.select("role_id")
		.eq("kouden_id", koudenId)
		.eq("user_id", user.id)
		.single();

	if (!member) return null;

	const { data: role } = await supabase
		.from("kouden_roles")
		.select("name")
		.eq("id", member.role_id)
		.single();

	return (role?.name as KoudenPermission) || null;
}
