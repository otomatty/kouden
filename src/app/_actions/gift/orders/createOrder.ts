import { createClient } from "@/lib/supabase/server";

/**
 * Create a new order.
 * 新しい注文を作成します。
 *
 * @param data - Object containing organizationId, customerId, totalAmount, status?.
 */
export async function createOrder(data: {
	organizationId: string;
	customerId: string;
	totalAmount: number;
	status?: string;
}) {
	const supabase = await createClient();
	const { data: order, error } = await supabase
		.schema("gift")
		.from("orders")
		.insert({
			organization_id: data.organizationId,
			customer_id: data.customerId,
			total_amount: data.totalAmount,
			status: data.status,
		})
		.select()
		.single();
	if (error) throw error;
	return order;
}
