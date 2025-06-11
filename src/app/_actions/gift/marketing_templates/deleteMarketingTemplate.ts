import { createClient } from "@/lib/supabase/server";

/**
 * Delete a marketing template by ID.
 * ID を指定してマーケティングテンプレートを削除します。
 *
 * @param id - The marketing template ID.
 */
export async function deleteMarketingTemplate(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("gift").from("marketing_templates").delete().eq("id", id);
	if (error) throw error;
	return true;
}
