import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of order items for an order.
 * 注文に紐づく注文アイテムの一覧を取得します。
 *
 * @param orderId - The order ID.
 * @returns Array of order items.
 */
export async function listOrderItems(orderId: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.schema("gift")
		.from("order_items")
		.select("*")
		.eq("order_id", orderId);
	if (error) throw error;
	return data;
}
