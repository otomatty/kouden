import { createClient } from "@/lib/supabase/server";

/**
 * Delete a quote by ID.
 * @param id - The quote ID to delete
 */
export async function deleteQuote(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("funeral").from("quotes").delete().eq("id", id);
	if (error) throw error;
	return true;
}
