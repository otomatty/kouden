import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of material orders.
 * 資材発注の一覧を取得します。
 *
 * @returns Array of material orders.
 */
export async function listMaterialOrders() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("funeral").from("material_orders").select("*");
	if (error) throw error;
	return data;
}
