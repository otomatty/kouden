"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { getUserAuthInfo } from "./auth-info";
import { getUserAdminInfo, getUserKoudens, getUserStats } from "./helpers";
import type { UserDetail } from "./types";

/**
 * ユーザー詳細情報を取得
 */
export async function getUserDetail(userId: string): Promise<ActionResult<UserDetail>> {
	return withActionResult(async () => {
		// 管理者権限をチェック（入り口で1回だけ）
		const { isAdmin: isAdminUser } = await import("@/app/_actions/admin/permissions");
		const adminCheck = await isAdminUser();
		if (!adminCheck) {
			throw new KoudenError("管理者権限が必要です", ErrorCodes.FORBIDDEN);
		}

		const supabase = await createClient();

		// 基本情報を取得
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", userId)
			.single();

		if (profileError) throw profileError;
		if (!profile) throw new KoudenError("ユーザーが見つかりません", ErrorCodes.NOT_FOUND);

		// 詳細情報を並列取得
		const [authInfo, stats, adminInfo, koudens] = await Promise.all([
			getUserAuthInfo(userId),
			getUserStats(userId),
			getUserAdminInfo(userId),
			getUserKoudens(userId),
		]);

		return {
			...profile,
			...authInfo,
			stats,
			admin_info: adminInfo,
			koudens,
		};
	}, "ユーザー詳細の取得");
}
