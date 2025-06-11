import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of marketing templates for a campaign.
 * キャンペーンに紐づくマーケティングテンプレートの一覧を取得します。
 *
 * @param campaignId - The marketing campaign ID.
 * @returns Array of marketing templates.
 */
export async function listMarketingTemplates(campaignId: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.schema("gift")
		.from("marketing_templates")
		.select("*")
		.eq("campaign_id", campaignId);
	if (error) throw error;
	return data;
}
