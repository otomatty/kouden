import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single marketing campaign by ID.
 * ID を指定して単一のマーケティングキャンペーンを取得します。
 *
 * @param id - The marketing campaign ID.
 */
export async function getMarketingCampaign(id: string) {
	const supabase = await createClient();
	const { data: campaign, error } = await supabase
		.schema("gift")
		.from("marketing_campaigns")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return campaign;
}
