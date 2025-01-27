"use server";

import { createClient } from "@/lib/supabase/server";
import type { KoudenPermission } from "@/types/role";

// 権限チェック関数
export async function checkKoudenPermission(
	koudenId: string,
): Promise<KoudenPermission> {
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
		return "owner";
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
		return "editor";
	}
	if (member.kouden_roles.name === "viewer") {
		return "viewer";
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
