import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing shipping record by ID.
 * ID を指定して既存の配送情報を更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateShipping(data: {
	id: string;
	carrier?: string;
	trackingNo?: string;
	status?: string;
	deliveredAt?: string;
}) {
	const { id, carrier, trackingNo, status, deliveredAt } = data;
	const supabase = await createClient();
	const { data: shipping, error } = await supabase
		.schema("gift")
		.from("shipping")
		.update({
			...(carrier !== undefined && { carrier }),
			...(trackingNo !== undefined && { tracking_no: trackingNo }),
			...(status !== undefined && { status }),
			...(deliveredAt !== undefined && { delivered_at: deliveredAt }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return shipping;
}
