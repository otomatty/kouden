import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing tier by ID.
 * ID を指定して既存のティアを更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateTier(data: {
	id: string;
	name?: string;
	threshold?: number;
}) {
	const { id, name, threshold } = data;
	const supabase = await createClient();
	const { data: tier, error } = await supabase
		.schema("gift")
		.from("tiers")
		.update({
			...(name !== undefined && { name }),
			...(threshold !== undefined && { threshold }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return tier;
}
