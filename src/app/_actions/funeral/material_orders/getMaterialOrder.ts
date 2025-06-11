import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single material order by ID.
 * ID を指定して単一の資材発注を取得します。
 *
 * @param id - The material order ID.
 */
export async function getMaterialOrder(id: string) {
	const supabase = await createClient();
	const { data: order, error } = await supabase
		.schema("funeral")
		.from("material_orders")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return order;
}
