import { createClient } from "@/lib/supabase/server";

/**
 * Delete a marketing campaign by ID.
 * ID を指定してマーケティングキャンペーンを削除します。
 *
 * @param id - The marketing campaign ID.
 */
export async function deleteMarketingCampaign(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("gift").from("marketing_campaigns").delete().eq("id", id);
	if (error) throw error;
	return true;
}
