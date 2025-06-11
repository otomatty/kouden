import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of tiers.
 * ティアの一覧を取得します。
 *
 * @returns Array of tiers.
 */
export async function listTiers() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("gift").from("tiers").select("*");
	if (error) throw error;
	return data;
}
