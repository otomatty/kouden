"use server";

import { createClient } from "@/lib/supabase/server";
import type {
	Announcement,
	CreateAnnouncementInput,
	UpdateAnnouncementInput,
} from "@/types/announcements";
import logger from "@/lib/logger";

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
			logger.error(
				{
					error: error.message,
					code: error.code,
				},
				"Failed to fetch announcements",
			);
			throw new Error("お知らせの取得に失敗しました");
		}

		return { announcements: announcements || [] };
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
			},
			"Error in getActiveAnnouncements",
		);
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
			logger.error(
				{
					error: error.message,
					code: error.code,
					userId: user.id,
				},
				"Failed to fetch all announcements",
			);
			throw new Error("お知らせの取得に失敗しました");
		}

		return { announcements: announcements || [] };
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
			},
			"Error in getAllAnnouncements",
		);
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
			logger.error(
				{
					error: error.message,
					code: error.code,
					userId: user.id,
					input,
				},
				"Failed to create announcement",
			);
			throw new Error("お知らせの作成に失敗しました");
		}

		return { announcement };
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				input,
			},
			"Error in createAnnouncement",
		);
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
			logger.error(
				{
					error: error.message,
					code: error.code,
					userId: user.id,
					id: input.id,
				},
				"Failed to update announcement",
			);
			throw new Error("お知らせの更新に失敗しました");
		}

		return { announcement };
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				id: input.id,
			},
			"Error in updateAnnouncement",
		);
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
			logger.error(
				{
					error: error.message,
					code: error.code,
					userId: user.id,
					id,
				},
				"Failed to delete announcement",
			);
			throw new Error("お知らせの削除に失敗しました");
		}

		return { success: true };
	} catch (error) {
		logger.error(
			{
				error: error instanceof Error ? error.message : String(error),
				id,
			},
			"Error in deleteAnnouncement",
		);
		return {
			error: error instanceof Error ? error.message : "お知らせの削除に失敗しました",
		};
	}
}
