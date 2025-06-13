"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Add a new attendee to a funeral case.
 * @param data - Details of the attendee to add
 */
export async function addAttendee(data: {
	organizationId: string;
	caseId: string;
	name: string;
	relation?: string;
	status?: string;
}) {
	const supabase = await createClient();
	const { data: attendee, error } = await supabase
		.schema("funeral")
		.from("attendees")
		.insert({
			organization_id: data.organizationId,
			case_id: data.caseId,
			name: data.name,
			relation: data.relation,
			status: data.status,
		})
		.select()
		.single();
	if (error) throw error;
	return attendee;
}
