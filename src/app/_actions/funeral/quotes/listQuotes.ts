import { createClient } from "@/lib/supabase/server";

/**
 * List quotes for a specific funeral case.
 * @param caseId - The case ID to filter quotes
 */
export async function listQuotes(caseId: string) {
	const supabase = await createClient();
	const { data: quotes, error } = await supabase
		.schema("funeral")
		.from("quotes")
		.select("*")
		.eq("case_id", caseId);
	if (error) throw error;
	return quotes;
}
