import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single marketing template by ID.
 * ID を指定して単一のマーケティングテンプレートを取得します。
 *
 * @param id - The marketing template ID.
 */
export async function getMarketingTemplate(id: string) {
	const supabase = await createClient();
	const { data: template, error } = await supabase
		.schema("gift")
		.from("marketing_templates")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return template;
}
