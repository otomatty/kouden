import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of inventory items for the current organization.
 */
export async function listInventories() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("common").from("inventory").select("*");
	if (error) throw error;
	return data;
}
