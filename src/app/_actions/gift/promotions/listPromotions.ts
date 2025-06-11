import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of promotions.
 * プロモーションの一覧を取得します。
 *
 * @returns Array of promotions.
 */
export async function listPromotions() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("gift").from("promotions").select("*");
	if (error) throw error;
	return data;
}
