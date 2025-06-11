import { createClient } from "@/lib/supabase/server";

/**
 * Create a new shipping record.
 * 新しい配送情報を作成します。
 *
 * @param data - Object containing organizationId, orderId, carrier, trackingNo?, status?, deliveredAt?.
 */
export async function createShipping(data: {
	organizationId: string;
	orderId: string;
	carrier: string;
	trackingNo?: string;
	status?: string;
	deliveredAt?: string;
}) {
	const supabase = await createClient();
	const { data: shipping, error } = await supabase
		.schema("gift")
		.from("shipping")
		.insert({
			organization_id: data.organizationId,
			order_id: data.orderId,
			carrier: data.carrier,
			tracking_no: data.trackingNo,
			status: data.status,
			delivered_at: data.deliveredAt,
		})
		.select()
		.single();
	if (error) throw error;
	return shipping;
}
