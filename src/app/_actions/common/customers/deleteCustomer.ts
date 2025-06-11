import { createClient } from "@/lib/supabase/server";

/**
 * Delete a customer by ID.
 * @param id - The customer ID
 */
export async function deleteCustomer(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("common").from("customers").delete().eq("id", id);
	if (error) throw error;
	return true;
}
