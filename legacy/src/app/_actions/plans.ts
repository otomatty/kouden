"use server";

import { type ActionResult, withActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type Plan = Database["public"]["Tables"]["plans"]["Row"];

/**
 * プラン一覧取得
 * 認証不要
 */
export async function getPlans(): Promise<ActionResult<Plan[]>> {
	return withActionResult(async () => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("plans")
			.select("*")
			.order("price", { ascending: true });

		if (error) throw error;
		return data ?? [];
	}, "プラン一覧の取得");
}
