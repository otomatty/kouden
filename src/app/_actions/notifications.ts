"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

/**
 * 通知一覧取得
 */
export async function getNotifications(): Promise<{
	notifications?: Notification[];
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
		.select("*")
		.eq("user_id", user.id)
		.order("sent_at", { ascending: false });
	if (error) {
		console.error("[ERROR] Error fetching notifications:", error);
		return { error: "通知一覧の取得に失敗しました" };
	}
	return { notifications: data };
}

/**
 * 通知既読（未実装）
 */
export async function markNotificationRead(): Promise<{ error?: string }> {
	// read カラムが存在しないため未実装
	return { error: "markNotificationReadは未実装です" };
}
