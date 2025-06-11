import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single customer by ID.
 * @param id - The customer ID
 */
export async function getCustomer(id: string) {
	const supabase = await createClient();
	const { data: customer, error } = await supabase
		.schema("common")
		.from("customers")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return customer;
}
