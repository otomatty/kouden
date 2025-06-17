"use server";

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
export async function getActiveAnnouncements(): Promise<{
	announcements: Announcement[];
	error?: string;
}> {
	try {
		const supabase = await createClient();

		const { data: announcements, error } = await supabase
			.from("announcements")
			.select("*")
			.eq("is_active", true)
			.or(`show_until.is.null,show_until.gte.${new Date().toISOString()}`)
			.order("priority", { ascending: false })
			.order("created_at", { ascending: false });

		if (error) {
			console.error("[ERROR] Failed to fetch announcements:", error);
			throw new Error("お知らせの取得に失敗しました");
		}

		return { announcements: announcements || [] };
	} catch (error) {
		console.error("[ERROR] Error in getActiveAnnouncements:", error);
		return {
			announcements: [],
			error: error instanceof Error ? error.message : "お知らせの取得に失敗しました",
		};
	}
}

/**
 * 管理画面用：全てのお知らせを取得
 */
export async function getAllAnnouncements(): Promise<{
	announcements: Announcement[];
	error?: string;
}> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証が必要です");
		}

		// 管理者権限チェックは実装に応じて追加
		const { data: announcements, error } = await supabase
			.from("announcements")
			.select("*")
			.order("priority", { ascending: false })
			.order("created_at", { ascending: false });

		if (error) {
			console.error("[ERROR] Failed to fetch all announcements:", error);
			throw new Error("お知らせの取得に失敗しました");
		}

		return { announcements: announcements || [] };
	} catch (error) {
		console.error("[ERROR] Error in getAllAnnouncements:", error);
		return {
			announcements: [],
			error: error instanceof Error ? error.message : "お知らせの取得に失敗しました",
		};
	}
}

/**
 * お知らせを作成
 */
export async function createAnnouncement(input: CreateAnnouncementInput): Promise<{
	announcement?: Announcement;
	error?: string;
}> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証が必要です");
		}

		const { data: announcement, error } = await supabase
			.from("announcements")
			.insert({
				...input,
				created_by: user.id,
				priority: input.priority ?? 0,
			})
			.select()
			.single();

		if (error) {
			console.error("[ERROR] Failed to create announcement:", error);
			throw new Error("お知らせの作成に失敗しました");
		}

		return { announcement };
	} catch (error) {
		console.error("[ERROR] Error in createAnnouncement:", error);
		return {
			error: error instanceof Error ? error.message : "お知らせの作成に失敗しました",
		};
	}
}

/**
 * お知らせを更新
 */
export async function updateAnnouncement(input: UpdateAnnouncementInput): Promise<{
	announcement?: Announcement;
	error?: string;
}> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証が必要です");
		}

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

		if (error) {
			console.error("[ERROR] Failed to update announcement:", error);
			throw new Error("お知らせの更新に失敗しました");
		}

		return { announcement };
	} catch (error) {
		console.error("[ERROR] Error in updateAnnouncement:", error);
		return {
			error: error instanceof Error ? error.message : "お知らせの更新に失敗しました",
		};
	}
}

/**
 * お知らせを削除
 */
export async function deleteAnnouncement(id: string): Promise<{
	success?: boolean;
	error?: string;
}> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("認証が必要です");
		}

		const { error } = await supabase.from("announcements").delete().eq("id", id);

		if (error) {
			console.error("[ERROR] Failed to delete announcement:", error);
			throw new Error("お知らせの削除に失敗しました");
		}

		return { success: true };
	} catch (error) {
		console.error("[ERROR] Error in deleteAnnouncement:", error);
		return {
			error: error instanceof Error ? error.message : "お知らせの削除に失敗しました",
		};
	}
}
