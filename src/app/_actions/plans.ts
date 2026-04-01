"use server";

import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type Plan = Database["public"]["Tables"]["plans"]["Row"];

/**
 * プラン一覧取得
 * 認証不要
 */
export async function getPlans(): Promise<{ plans?: Plan[]; error?: string }> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("plans")
		.select("*")
		.order("price", { ascending: true });

	if (error) {
		logger.error(
			{
				error: error.message,
				code: error.code,
			},
			"[ERROR] Error fetching plans",
		);
		return { error: "プラン一覧の取得に失敗しました" };
	}
	return { plans: data };
}
