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

export async function updateUserSettings(
	userId: string,
	params: UpdateSettingsParams,
) {
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
