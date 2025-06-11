import { createClient } from "@/lib/supabase/server";

/**
 * Create a new order item.
 * 新しい注文アイテムを作成します。
 *
 * @param data - Object containing orderId, productId, quantity, unitPrice.
 */
export async function createOrderItem(data: {
	orderId: string;
	productId: string;
	quantity: number;
	unitPrice: number;
}) {
	const supabase = await createClient();
	const { data: item, error } = await supabase
		.schema("gift")
		.from("order_items")
		.insert({
			order_id: data.orderId,
			product_id: data.productId,
			quantity: data.quantity,
			unit_price: data.unitPrice,
		})
		.select()
		.single();
	if (error) throw error;
	return item;
}
