"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateSettingsParams {
	guide_mode?: boolean;
	theme?: "light" | "dark" | "system";
}

export async function getUserSettings(userId: string) {
	try {
		const supabase = await createClient();

		const { data: settings, error } = await supabase
			.from("user_settings")
			.select("*")
			.eq("id", userId)
			.single();

		if (error) {
			throw error;
		}

		return { settings, error: null };
	} catch (error) {
		console.error("Error:", error);
		return {
			settings: null,
			error: "設定の取得に失敗しました",
		};
	}
}

export async function updateUserSettings(userId: string, params: UpdateSettingsParams) {
	try {
		const supabase = await createClient();

		const { data: settings, error } = await supabase
			.from("user_settings")
			.update({
				...params,
				updated_at: new Date().toISOString(),
			})
			.eq("id", userId)
			.select()
			.single();

		if (error) {
			throw error;
		}

		revalidatePath("/settings");
		return { settings, error: null };
	} catch (error) {
		console.error("Error:", error);
		return {
			settings: null,
			error: "設定の更新に失敗しました",
		};
	}
}

/**
 * ユーザーのガイド表示設定を取得する
 * @returns {Promise<boolean>} ガイドを表示するかどうか
 */
export async function getGuideVisibility(): Promise<boolean> {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			console.error("getGuideVisibility: ユーザー情報の取得に失敗:", userError);
			return false;
		}

		const { data, error } = await supabase
			.from("user_settings")
			.select("guide_mode")
			.eq("id", user.id)
			.single();

		if (error) {
			console.error("getGuideVisibility: 設定の取得に失敗:", error);
			return true;
		}

		const guideMode = data?.guide_mode ?? true;
		return guideMode;
	} catch (error) {
		console.error("getGuideVisibility: 予期せぬエラーが発生:", error);
		return true;
	}
}

/**
 * ガイドの表示設定を更新する
 * @param show ガイドを表示するかどうか
 */
export async function updateGuideVisibility(show: boolean) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			throw new Error("認証が必要です");
		}

		const { error } = await supabase
			.from("user_settings")
			.update({
				guide_mode: show,
				updated_at: new Date().toISOString(),
			})
			.eq("id", user.id);

		if (error) throw error;

		// キャッシュを再検証
		revalidatePath("/koudens");
		return { success: true, error: null };
	} catch (error) {
		console.error("Error:", error);
		return {
			success: false,
			error: "設定の更新に失敗しました",
		};
	}
}
