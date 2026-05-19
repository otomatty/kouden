"use server";

import { checkAdminPermission } from "@/app/_actions/admin/permissions";
import { type ActionResult, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type {
	Announcement,
	CreateAnnouncementInput,
	UpdateAnnouncementInput,
} from "@/types/announcements";

/**
 * アクティブなお知らせを取得（表示用）
 * 優先度順、有効期限チェック済み
 */
export async function getActiveAnnouncements(): Promise<ActionResult<Announcement[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();

		const { data: announcements, error } = await supabase
			.from("announcements")
			.select("*")
			.eq("is_active", true)
			.or(`show_until.is.null,show_until.gte.${new Date().toISOString()}`)
			.order("priority", { ascending: false })
			.order("created_at", { ascending: false });

		if (error) throw error;

		return announcements ?? [];
	}, "お知らせの取得");
}

/**
 * 管理画面用：全てのお知らせを取得
 */
export async function getAllAnnouncements(): Promise<ActionResult<Announcement[]>> {
	return withActionResult(async () => {
		const { supabase } = await checkAdminPermission();

		const { data: announcements, error } = await supabase
			.from("announcements")
			.select("*")
			.order("priority", { ascending: false })
			.order("created_at", { ascending: false });

		if (error) throw error;

		return announcements ?? [];
	}, "お知らせの取得");
}

/**
 * お知らせを作成
 */
export async function createAnnouncement(
	input: CreateAnnouncementInput,
): Promise<ActionResult<Announcement>> {
	return withActionResult(async () => {
		const { supabase, user } = await checkAdminPermission();

		const { data: announcement, error } = await supabase
			.from("announcements")
			.insert({
				...input,
				created_by: user.id,
				priority: input.priority ?? 0,
			})
			.select()
			.single();

		if (error) throw error;

		return announcement;
	}, "お知らせの作成");
}

/**
 * お知らせを更新
 */
export async function updateAnnouncement(
	input: UpdateAnnouncementInput,
): Promise<ActionResult<Announcement>> {
	return withActionResult(async () => {
		const { supabase } = await checkAdminPermission();

		const { id, ...updateData } = input;

		const { data: announcement, error } = await supabase
			.from("announcements")
			.update({
				...updateData,
				updated_at: new Date().toISOString(),
			})
			.eq("id", id)
			.select()
			.single();

		if (error) throw error;

		return announcement;
	}, "お知らせの更新");
}

/**
 * お知らせを削除
 */
export async function deleteAnnouncement(id: string): Promise<ActionResult<null>> {
	return withActionResult(async () => {
		const { supabase } = await checkAdminPermission();

		const { error } = await supabase.from("announcements").delete().eq("id", id);

		if (error) throw error;

		return null;
	}, "お知らせの削除");
}
