"use server";

import { createClient } from "@/lib/supabase/server";
import type { NotificationItem } from "@/types/notifications";

/**
 * 通知一覧取得
 */
export async function getNotifications(): Promise<{
	notifications?: NotificationItem[];
	error?: string;
}> {
	const supabase = await createClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) {
		return { error: "認証が必要です" };
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
	if (error) {
		console.error("[ERROR] Error fetching notifications:", error);
		return { error: "通知一覧の取得に失敗しました" };
	}
	return { notifications: data as NotificationItem[] };
}

/**
 * 通知既読（未実装）
 */
export async function markNotificationRead(): Promise<{ error?: string }> {
	const supabase = await createClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) {
		return { error: "認証が必要です" };
	}
	const { error } = await supabase
		.from("notifications")
		.update({ is_read: true })
		.eq("user_id", user.id)
		.eq("is_read", false);
	if (error) {
		console.error("[ERROR] Error marking notifications as read:", error);
		return { error: "通知既読設定に失敗しました" };
	}
	return {};
}
