"use server";

import { createClient } from "@/lib/supabase/server";
import type { KoudenMember } from "@/types/member";

export async function getKoudenMembers(
	koudenId: string,
): Promise<KoudenMember[]> {
	const supabase = await createClient();

	try {
		// セッション情報を確認
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError) {
			console.error("[ERROR] Failed to get user session:", userError);
			throw new Error("認証情報の取得に失敗しました");
		}

		// メンバー情報を取得
		const { data: members, error } = await supabase
			.from("kouden_members")
			.select(`
				id,
				user_id,
				kouden_id,
				role:kouden_roles (
					id,
					name
				)
			`)
			.eq("kouden_id", koudenId);

		if (error) {
			console.error("[ERROR] Failed to fetch members:", error);
			throw new Error("メンバー一覧の取得に失敗しました");
		}

		if (!members.length) {
			return [];
		}

		// プロファイル情報を取得
		const { data: profiles, error: profileError } = await supabase
			.from("profiles")
			.select("id, display_name, avatar_url")
			.in(
				"id",
				members.map((m) => m.user_id),
			);

		if (profileError) {
			console.error("[ERROR] Failed to fetch profiles:", profileError);
			throw new Error("プロファイル情報の取得に失敗しました");
		}

		// メンバー情報とプロファイル情報を結合
		const result = members.map((member) => ({
			...member,
			profile: profiles?.find((p) => p.id === member.user_id),
		}));

		return result;
	} catch (error) {
		console.error("[ERROR] Error in getKoudenMembers:", error);
		throw error;
	}
}
