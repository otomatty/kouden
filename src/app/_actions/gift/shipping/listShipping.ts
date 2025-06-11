import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of shipping records.
 * 配送情報の一覧を取得します。
 *
 * @returns Array of shipping records.
 */
export async function listShipping() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("gift").from("shipping").select("*");
	if (error) throw error;
	return data;
}
