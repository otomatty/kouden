import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single contact by ID.
 * @param id - The contact ID
 */
export async function getContact(id: string) {
	const supabase = await createClient();
	const { data: contact, error } = await supabase
		.schema("funeral")
		.from("contacts")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return contact;
}
