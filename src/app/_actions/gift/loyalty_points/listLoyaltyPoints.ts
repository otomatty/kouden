import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of loyalty point records.
 * ロイヤルティポイントレコードの一覧を取得します。
 *
 * @returns Array of loyalty point records.
 */
export async function listLoyaltyPoints() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("gift").from("loyalty_points").select("*");
	if (error) throw error;
	return data;
}
