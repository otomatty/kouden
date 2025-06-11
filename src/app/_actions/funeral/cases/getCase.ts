import { createClient } from "@/lib/supabase/server";

/**
 * Get a single funeral case by ID.
 * @param id - The case ID
 */
export async function getCase(id: string) {
	const supabase = await createClient();
	const { data: caseRecord, error } = await supabase
		.schema("funeral")
		.from("cases")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return caseRecord;
}
