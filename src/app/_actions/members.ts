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
		if (userError || !user) {
			console.error("[ERROR] Failed to get user session:", userError);
			throw new Error("認証情報の取得に失敗しました");
		}

		// アクセス権限の確認
		const { data: accessCheck } = await supabase
			.from("koudens")
			.select("id")
			.eq("id", koudenId)
			.eq("owner_id", user.id)
			.single();

		if (!accessCheck) {
			const { data: memberCheck } = await supabase
				.from("kouden_members")
				.select("id")
				.eq("kouden_id", koudenId)
				.eq("user_id", user.id)
				.single();

			if (!memberCheck) {
				throw new Error("この香典帳へのアクセス権限がありません");
			}
		}

		// メンバー情報とプロフィール情報を一度に取得
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

		// プロフィール情報を別途取得
		const { data: profiles, error: profileError } = await supabase
			.from("profiles")
			.select("id, display_name, avatar_url")
			.in(
				"id",
				members.map((m) => m.user_id),
			);

		if (profileError) {
			console.error("[ERROR] Failed to fetch profiles:", profileError);
			throw new Error("プロフィール情報の取得に失敗しました");
		}

		return members.map((member) => {
			const profile = profiles?.find((p) => p.id === member.user_id);
			return {
				...member,
				profile: profile
					? {
							display_name: profile.display_name,
							avatar_url: profile.avatar_url,
						}
					: undefined,
			};
		});
	} catch (error) {
		console.error("[ERROR] Error in getKoudenMembers:", error);
		throw error;
	}
}
