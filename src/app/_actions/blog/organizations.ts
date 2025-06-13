"use server";

import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/utils/get-error-message";

/**
 * ユーザーがアクセス可能な組織一覧を取得する
 * @returns 組織一覧
 */
export async function getAccessibleOrganizations() {
	const supabase = await createClient();
	try {
		const { data: authData, error: authError } = await supabase.auth.getUser();
		if (authError || !authData.user) {
			throw new Error("User not authenticated.");
		}

		// admin権限の場合は全組織を取得
		const { data: profile } = await supabase
			.from("admin_users")
			.select("role")
			.eq("user_id", authData.user.id)
			.single();

		if (profile?.role === "admin") {
			const { data: orgs, error } = await supabase
				.schema("common")
				.from("organizations")
				.select("id, name")
				.eq("status", "active")
				.order("name");

			if (error) {
				// 権限エラーの場合は空配列を返す
				return { data: [], error: null };
			}

			return { data: orgs || [], error: null };
		}

		// 通常ユーザーは所属組織のみ取得
		const { data: memberOrgs, error } = await supabase
			.schema("common")
			.from("organization_members")
			.select(`
				organization_id,
				organizations:organization_id(id, name)
			`)
			.eq("user_id", authData.user.id);

		if (error) {
			return { data: [], error: null };
		}

		const organizations =
			memberOrgs
				?.map((member) => member.organizations)
				.filter(Boolean)
				.flat() || [];

		return { data: organizations, error: null };
	} catch (error) {
		return { data: [], error: getErrorMessage(error) };
	}
}

/**
 * 現在のコンテキストに基づく組織IDを取得する
 * @param path 現在のパス
 * @returns 組織ID
 */
export async function getContextOrganizationId(path: string) {
	// const supabase = await createClient();
	try {
		// パスから組織コンテキストを判定
		if (path.startsWith("/admin")) {
			// admin画面では組織選択は任意
			return { data: null, error: null };
		}

		// その他の管理画面では現在の組織IDを取得
		// TODO: パスやセッションから組織IDを取得する実装
		// 例: /funeral-home/[org_id] や /gift-shop/[org_id] などから抽出

		return { data: null, error: null };
	} catch (error) {
		return { data: null, error: getErrorMessage(error) };
	}
}
