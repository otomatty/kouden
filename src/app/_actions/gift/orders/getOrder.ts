import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single order by ID.
 * ID を指定して単一の注文を取得します。
 *
 * @param id - The order ID.
 */
export async function getOrder(id: string) {
	const supabase = await createClient();
	const { data: order, error } = await supabase
		.schema("gift")
		.from("orders")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return order;
}
