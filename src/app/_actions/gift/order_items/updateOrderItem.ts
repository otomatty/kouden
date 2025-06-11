import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing order item.
 * 既存の注文アイテムを更新します。
 *
 * @param data - Object containing orderId, productId, quantity?, unitPrice?.
 */
export async function updateOrderItem(data: {
	orderId: string;
	productId: string;
	quantity?: number;
	unitPrice?: number;
}) {
	const { orderId, productId, quantity, unitPrice } = data;
	const supabase = await createClient();
	const { data: item, error } = await supabase
		.schema("gift")
		.from("order_items")
		.update({
			...(quantity !== undefined && { quantity }),
			...(unitPrice !== undefined && { unit_price: unitPrice }),
		})
		.eq("order_id", orderId)
		.eq("product_id", productId)
		.select()
		.single();
	if (error) throw error;
	return item;
}
