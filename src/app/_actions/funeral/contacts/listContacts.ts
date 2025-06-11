import { createClient } from "@/lib/supabase/server";

/**
 * List contact records for a specific customer.
 * @param customerId - ID of the customer to filter contacts.
 */
export async function listContacts(customerId: string) {
	const supabase = await createClient();
	const { data: contacts, error } = await supabase
		.schema("funeral")
		.from("contacts")
		.select("*")
		.eq("customer_id", customerId);
	if (error) throw error;
	return contacts;
}
