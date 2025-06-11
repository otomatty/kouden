import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing marketing campaign by ID.
 * ID を指定して既存のマーケティングキャンペーンを更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateMarketingCampaign(data: {
	id: string;
	name?: string;
	startDate?: string;
	endDate?: string;
	status?: string;
}) {
	const { id, name, startDate, endDate, status } = data;
	const supabase = await createClient();
	const { data: campaign, error } = await supabase
		.schema("gift")
		.from("marketing_campaigns")
		.update({
			...(name !== undefined && { name }),
			...(startDate !== undefined && { start_date: startDate }),
			...(endDate !== undefined && { end_date: endDate }),
			...(status !== undefined && { status }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return campaign;
}
