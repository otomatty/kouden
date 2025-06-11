import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing marketing template by ID.
 * ID を指定して既存のマーケティングテンプレートを更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateMarketingTemplate(data: {
	id: string;
	type?: string;
	content?: string;
}) {
	const { id, type, content } = data;
	const supabase = await createClient();
	const { data: template, error } = await supabase
		.schema("gift")
		.from("marketing_templates")
		.update({
			...(type !== undefined && { type }),
			...(content !== undefined && { content }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return template;
}
