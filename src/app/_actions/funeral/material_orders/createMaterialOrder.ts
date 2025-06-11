import { createClient } from "@/lib/supabase/server";

/**
 * Create a new material order.
 * 新しい資材発注を作成します。
 *
 * @param data - Object containing organizationId, caseId, item, quantity, orderDate?, status?.
 */
export async function createMaterialOrder(data: {
	organizationId: string;
	caseId: string;
	item: string;
	quantity: number;
	orderDate?: string;
	status?: string;
}) {
	const supabase = await createClient();
	const { data: order, error } = await supabase
		.schema("funeral")
		.from("material_orders")
		.insert({
			organization_id: data.organizationId,
			case_id: data.caseId,
			item: data.item,
			quantity: data.quantity,
			order_date: data.orderDate,
			status: data.status,
		})
		.select()
		.single();
	if (error) throw error;
	return order;
}
