import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of marketing campaigns.
 * マーケティングキャンペーンの一覧を取得します。
 *
 * @returns Array of marketing campaigns.
 */
export async function listMarketingCampaigns() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("gift").from("marketing_campaigns").select("*");
	if (error) throw error;
	return data;
}
