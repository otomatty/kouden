import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single tier by ID.
 * ID を指定して単一のティアを取得します。
 *
 * @param id - The tier ID.
 */
export async function getTier(id: string) {
	const supabase = await createClient();
	const { data: tier, error } = await supabase
		.schema("gift")
		.from("tiers")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return tier;
}
