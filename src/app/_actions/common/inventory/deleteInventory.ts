import { createClient } from "@/lib/supabase/server";

/**
 * Delete an inventory item by ID.
 * @param id - The inventory ID
 */
export async function deleteInventory(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("common").from("inventory").delete().eq("id", id);
	if (error) throw error;
	return true;
}
