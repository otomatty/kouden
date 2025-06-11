import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single quote by ID.
 * @param id - The quote ID
 */
export async function getQuote(id: string) {
	const supabase = await createClient();
	const { data: quote, error } = await supabase
		.schema("funeral")
		.from("quotes")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return quote;
}
