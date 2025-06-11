import { createClient } from "@/lib/supabase/server";

/**
 * Create a new marketing campaign.
 * 新しいマーケティングキャンペーンを作成します。
 *
 * @param data - Object containing organizationId, name, startDate?, endDate?, status?.
 */
export async function createMarketingCampaign(data: {
	organizationId: string;
	name: string;
	startDate?: string;
	endDate?: string;
	status?: string;
}) {
	const supabase = await createClient();
	const { data: campaign, error } = await supabase
		.schema("gift")
		.from("marketing_campaigns")
		.insert({
			organization_id: data.organizationId,
			name: data.name,
			start_date: data.startDate,
			end_date: data.endDate,
			status: data.status,
		})
		.select()
		.single();
	if (error) throw error;
	return campaign;
}
