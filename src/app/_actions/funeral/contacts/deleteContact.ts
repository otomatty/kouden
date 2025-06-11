import { createClient } from "@/lib/supabase/server";

/**
 * Delete a contact record by ID.
 * @param id - The contact ID
 */
export async function deleteContact(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("funeral").from("contacts").delete().eq("id", id);
	if (error) throw error;
	return true;
}
