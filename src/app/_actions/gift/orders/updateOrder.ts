import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing order by ID.
 * ID を指定して既存の注文を更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateOrder(data: {
	id: string;
	totalAmount?: number;
	status?: string;
}) {
	const { id, totalAmount, status } = data;
	const supabase = await createClient();
	const { data: order, error } = await supabase
		.schema("gift")
		.from("orders")
		.update({
			...(totalAmount !== undefined && { total_amount: totalAmount }),
			...(status !== undefined && { status }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return order;
}
