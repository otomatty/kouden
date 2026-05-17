"use server";

import { type ActionResult, ErrorCodes, KoudenError, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { NotificationItem } from "@/types/notifications";

/**
 * 通知一覧取得
 */
export async function getNotifications(): Promise<ActionResult<NotificationItem[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}
		const { data, error } = await supabase
			.from("notifications")
			.select(
				`
				id,
				created_at,
				is_read,
				data,
				link_path,
				notification_types (
					type_key,
					default_title,
					default_icon
				)
			`,
			)
			.eq("user_id", user.id)
			.order("created_at", { ascending: false });
		if (error) throw error;
		return (data as NotificationItem[]) ?? [];
	}, "通知一覧の取得");
}

/**
 * 通知既読（未実装）
 */
export async function markNotificationRead(): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();
		if (userError || !user) {
			throw new KoudenError("認証が必要です", ErrorCodes.UNAUTHORIZED);
		}
		const { error } = await supabase
			.from("notifications")
			.update({ is_read: true })
			.eq("user_id", user.id)
			.eq("is_read", false);
		if (error) throw error;
		return null;
	}, "通知既読設定");
}
