"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateProfileParams {
	display_name: string;
}

export async function getProfile(userId: string) {
	try {
		const supabase = await createClient();

		const { data: profile, error } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", userId)
			.single();

		if (error) {
			throw error;
		}

		return { profile, error: null };
	} catch (error) {
		console.error("Error:", error);
		return {
			profile: null,
			error: "プロフィールの取得に失敗しました",
		};
	}
}

export async function getActivityStats(userId: string) {
	try {
		const supabase = await createClient();

		// 作成した香典帳の数を取得
		const { count: ownedKoudensCount, error: ownedError } = await supabase
			.from("koudens")
			.select("*", { count: "exact", head: true })
			.eq("created_by", userId);

		if (ownedError) throw ownedError;

		// 参加している香典帳の数を取得
		const { count: participatingKoudensCount, error: participatingError } =
			await supabase
				.from("kouden_members")
				.select("*", { count: "exact", head: true })
				.eq("user_id", userId);

		if (participatingError) throw participatingError;

		// 登録した香典記録の数を取得
		const { count: totalEntriesCount, error: entriesError } = await supabase
			.from("kouden_entries")
			.select("*", { count: "exact", head: true })
			.eq("created_by", userId);

		if (entriesError) throw entriesError;

		// 最後の活動日時を取得（エントリーの作成日時から）
		const { data: lastActivity, error: lastActivityError } = await supabase
			.from("kouden_entries")
			.select("created_at")
			.eq("created_by", userId)
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		if (lastActivityError && lastActivityError.code !== "PGRST116") {
			throw lastActivityError;
		}

		return {
			stats: {
				ownedKoudensCount: ownedKoudensCount || 0,
				participatingKoudensCount: participatingKoudensCount || 0,
				totalEntriesCount: totalEntriesCount || 0,
				lastActivityAt: lastActivity?.created_at || null,
			},
			error: null,
		};
	} catch (error) {
		console.error("Error:", error);
		return {
			stats: null,
			error: "活動統計の取得に失敗しました",
		};
	}
}

export async function updateProfile(
	userId: string,
	params: UpdateProfileParams,
) {
	try {
		const supabase = await createClient();

		const { data: profile, error } = await supabase
			.from("profiles")
			.update({
				display_name: params.display_name,
				updated_at: new Date().toISOString(),
			})
			.eq("id", userId)
			.select()
			.single();

		if (error) {
			throw error;
		}

		revalidatePath("/profile");
		return { profile, error: null };
	} catch (error) {
		console.error("Error:", error);
		return {
			profile: null,
			error: "プロフィールの更新に失敗しました",
		};
	}
}

export async function updateAvatar(userId: string, avatarUrl: string) {
	try {
		const supabase = await createClient();

		const { data: profile, error } = await supabase
			.from("profiles")
			.update({
				avatar_url: avatarUrl,
				updated_at: new Date().toISOString(),
			})
			.eq("id", userId)
			.select()
			.single();

		if (error) {
			throw error;
		}

		revalidatePath("/profile");
		return { profile, error: null };
	} catch (error) {
		console.error("Error:", error);
		return {
			profile: null,
			error: "アバターの更新に失敗しました",
		};
	}
}
