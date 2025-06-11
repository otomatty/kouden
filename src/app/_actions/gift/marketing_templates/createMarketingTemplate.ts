import { createClient } from "@/lib/supabase/server";

/**
 * Create a new marketing template.
 * 新しいマーケティングテンプレートを作成します。
 *
 * @param data - Object containing campaignId, type, content.
 */
export async function createMarketingTemplate(data: {
	campaignId: string;
	type: string;
	content: string;
}) {
	const supabase = await createClient();
	const { data: template, error } = await supabase
		.schema("gift")
		.from("marketing_templates")
		.insert({
			campaign_id: data.campaignId,
			type: data.type,
			content: data.content,
		})
		.select()
		.single();
	if (error) throw error;
	return template;
}
