import { createClient } from "@/lib/supabase/server";

/**
 * Delete an order item.
 * 注文アイテムを削除します。
 *
 * @param orderId - The order ID.
 * @param productId - The product ID.
 */
export async function deleteOrderItem(orderId: string, productId: string) {
	const supabase = await createClient();
	const { error } = await supabase
		.schema("gift")
		.from("order_items")
		.delete()
		.eq("order_id", orderId)
		.eq("product_id", productId);
	if (error) throw error;
	return true;
}
