import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing material order by ID.
 * ID を指定して既存の資材発注を更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateMaterialOrder(data: {
	id: string;
	item?: string;
	quantity?: number;
	orderDate?: string;
	status?: string;
}) {
	const { id, item, quantity, orderDate, status } = data;
	const supabase = await createClient();
	const { data: order, error } = await supabase
		.schema("funeral")
		.from("material_orders")
		.update({
			...(item !== undefined && { item }),
			...(quantity !== undefined && { quantity }),
			...(orderDate !== undefined && { order_date: orderDate }),
			...(status !== undefined && { status }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return order;
}
