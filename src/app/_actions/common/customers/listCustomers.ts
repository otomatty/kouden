import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of customers for the current organization.
 */
export async function listCustomers() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("common").from("customers").select("*");
	if (error) throw error;
	return data;
}
