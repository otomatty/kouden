import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single order item by order ID and product ID.
 * 注文IDと商品IDを指定して単一の注文アイテムを取得します。
 *
 * @param orderId - The order ID.
 * @param productId - The product ID.
 */
export async function getOrderItem(orderId: string, productId: string) {
	const supabase = await createClient();
	const { data: item, error } = await supabase
		.schema("gift")
		.from("order_items")
		.select("*")
		.eq("order_id", orderId)
		.eq("product_id", productId)
		.single();
	if (error) throw error;
	return item;
}
