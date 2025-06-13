"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * List donations for a specific funeral case.
 * @param caseId - The case ID to filter donations
 */
export async function listDonations(caseId: string) {
	const supabase = await createClient();
	const { data: donations, error } = await supabase
		.schema("funeral")
		.from("donations")
		.select("*")
		.eq("case_id", caseId);
	if (error) throw error;
	return donations;
}
