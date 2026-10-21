import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { UserAdminInfo, UserKoudenItem, UserStats } from "./types";

/**
 * ユーザーの統計情報を取得
 */
export async function getUserStats(userId: string): Promise<UserStats> {
	const supabase = await createClient();

	try {
		// 並列でクエリ実行
		const [ownedKoudens, participatedKoudens, totalEntries] = await Promise.all([
			supabase.from("koudens").select("id", { count: "exact", head: true }).eq("owner_id", userId),
			supabase
				.from("kouden_members")
				.select("id", { count: "exact", head: true })
				.eq("user_id", userId),
			supabase
				.from("kouden_entries")
				.select("id", { count: "exact", head: true })
				.eq("created_by", userId),
		]);

		return {
			owned_koudens_count: ownedKoudens.count || 0,
			participated_koudens_count: participatedKoudens.count || 0,
			total_entries_count: totalEntries.count || 0,
		};
	} catch (error) {
		logger.error(
			{
				userId,
				error: error instanceof Error ? error.message : String(error),
			},
			"Error getting stats for user",
		);
		return {
			owned_koudens_count: 0,
			participated_koudens_count: 0,
			total_entries_count: 0,
		};
	}
}

/**
 * ユーザーの管理者情報を取得
 */
export async function getUserAdminInfo(userId: string): Promise<UserAdminInfo> {
	const supabase = await createClient();

	try {
		const { data: adminInfo, error } = await supabase
			.from("admin_users")
			.select("role, created_at")
			.eq("user_id", userId)
			.single();

		if (error || !adminInfo) return undefined;

		return {
			role: adminInfo.role as "admin" | "super_admin",
			granted_at: adminInfo.created_at || "",
		};
	} catch {
		return undefined;
	}
}

/**
 * ユーザーが参加している香典帳一覧を取得
 */
export async function getUserKoudens(userId: string): Promise<UserKoudenItem[]> {
	const supabase = await createClient();

	try {
		// 所有している香典帳（全ステータス）
		const { data: ownedKoudens } = await supabase
			.from("koudens")
			.select("id, title, created_at, updated_at, status")
			.eq("owner_id", userId)
			.order("created_at", { ascending: false });

		// 参加している香典帳（全ステータス）
		const { data: memberKoudens } = await supabase
			.from("kouden_members")
			.select(`
        created_at,
        kouden_id,
        koudens!inner(id, title, updated_at, status),
        kouden_roles!inner(name)
      `)
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		const koudens = [];

		// 所有している香典帳を追加
		if (ownedKoudens) {
			koudens.push(
				...ownedKoudens.map((kouden) => ({
					id: kouden.id,
					title: kouden.title,
					role: "owner" as const,
					joined_at: kouden.created_at,
					last_activity: kouden.updated_at,
					status: kouden.status, // ステータス情報も含める
				})),
			);
		}

		// 参加している香典帳を追加
		if (memberKoudens) {
			koudens.push(
				...memberKoudens.map((member) => ({
					id: member.koudens.id,
					title: member.koudens.title,
					role: member.kouden_roles.name === "editor" ? ("editor" as const) : ("viewer" as const),
					joined_at: member.created_at,
					last_activity: member.koudens.updated_at,
					status: member.koudens.status, // ステータス情報も含める
				})),
			);
		}

		// 重複を除去し、最新順にソート
		const uniqueKoudens = koudens.filter(
			(kouden, index, self) => index === self.findIndex((k) => k.id === kouden.id),
		);

		// ステータス情報を除いて返す（型定義に合わせるため）
		return uniqueKoudens
			.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
			.map(({ status, ...kouden }) => kouden);
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				userId,
			},
			`Error getting koudens for user ${userId}`,
		);
		return [];
	}
}
