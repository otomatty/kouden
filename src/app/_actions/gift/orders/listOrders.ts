import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of orders.
 * 注文の一覧を取得します。
 *
 * @returns Array of orders.
 */
export async function listOrders() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("gift").from("orders").select("*");
	if (error) throw error;
	return data;
}
