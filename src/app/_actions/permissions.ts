"use server";

import { createClient } from "@/lib/supabase/server";
import type { KoudenPermission, KoudenRole } from "@/types/role";

// 権限チェック関数
export async function checkKoudenPermission(koudenId: string): Promise<KoudenPermission> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("認証が必要です");
	}

	// オーナーチェック
	const { data: kouden, error: koudenError } = await supabase
		.from("koudens")
		.select("owner_id, created_by")
		.eq("id", koudenId)
		.single();

	if (koudenError || !kouden) {
		throw new Error("香典帳が見つかりません");
	}

	if (kouden.owner_id === user.id || kouden.created_by === user.id) {
		return "owner" as const;
	}

	// メンバーロールチェック
	const { data: member, error: memberError } = await supabase
		.from("kouden_members")
		.select("role_id, kouden_roles!inner(name)")
		.eq("kouden_id", koudenId)
		.eq("user_id", user.id)
		.single();

	if (memberError) {
		throw new Error("権限の取得に失敗しました");
	}

	if (!member) {
		throw new Error("アクセス権限がありません");
	}

	// 権限名の変換
	if (member.kouden_roles.name === "editor") {
		return "editor" as const;
	}
	if (member.kouden_roles.name === "viewer") {
		return "viewer" as const;
	}

	throw new Error("不明な権限です");
}

// 管理者権限チェック関数
export async function isKoudenOwner(koudenId: string): Promise<boolean> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return false;
	}

	const { data: kouden } = await supabase
		.from("koudens")
		.select("owner_id, created_by")
		.eq("id", koudenId)
		.single();

	return kouden?.owner_id === user.id || kouden?.created_by === user.id;
}

// 編集権限チェック関数
export async function hasEditPermission(koudenId: string): Promise<boolean> {
	try {
		const permission = await checkKoudenPermission(koudenId);
		return permission === "owner" || permission === "editor";
	} catch {
		return false;
	}
}

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
