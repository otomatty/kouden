"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * List attendees for a specific funeral case.
 * @param caseId - The case ID to filter attendees
 */
export async function listAttendees(caseId: string) {
	const supabase = await createClient();
	const { data: attendees, error } = await supabase
		.schema("funeral")
		.from("attendees")
		.select("*")
		.eq("case_id", caseId);
	if (error) throw error;
	return attendees;
}
