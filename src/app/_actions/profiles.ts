"use server";

import { type ActionResult, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import { revalidatePath } from "next/cache";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UpdateProfileParams {
	display_name: string;
}

interface ActivityStats {
	ownedKoudensCount: number;
	participatingKoudensCount: number;
	totalEntriesCount: number;
	lastActivityAt: string | null;
}

export async function getProfile(userId: string): Promise<ActionResult<Profile>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		const { data: profile, error } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", userId)
			.single();

		if (error) throw error;
		return profile;
	}, "プロフィールの取得");
}

export async function getActivityStats(userId: string): Promise<ActionResult<ActivityStats>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		// 作成した香典帳の数を取得
		const { count: ownedKoudensCount, error: ownedError } = await supabase
			.from("koudens")
			.select("*", { count: "exact", head: true })
			.eq("created_by", userId);

		if (ownedError) throw ownedError;

		// 参加している香典帳の数を取得
		const { count: participatingKoudensCount, error: participatingError } = await supabase
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
			ownedKoudensCount: ownedKoudensCount || 0,
			participatingKoudensCount: participatingKoudensCount || 0,
			totalEntriesCount: totalEntriesCount || 0,
			lastActivityAt: lastActivity?.created_at || null,
		};
	}, "活動統計の取得");
}

export async function updateProfile(
	userId: string,
	params: UpdateProfileParams,
): Promise<ActionResult<Profile>> {
	return withActionResult(async () => {
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

		if (error) throw error;

		revalidatePath("/profile");
		return profile;
	}, "プロフィールの更新");
}

export async function updateAvatar(
	userId: string,
	avatarUrl: string,
): Promise<ActionResult<Profile>> {
	return withActionResult(async () => {
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

		if (error) throw error;

		revalidatePath("/profile");
		return profile;
	}, "アバターの更新");
}
