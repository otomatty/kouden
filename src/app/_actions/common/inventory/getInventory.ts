import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single inventory item by ID.
 * @param id - The inventory ID
 */
export async function getInventory(id: string) {
	const supabase = await createClient();
	const { data: inventory, error } = await supabase
		.schema("common")
		.from("inventory")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return inventory;
}
