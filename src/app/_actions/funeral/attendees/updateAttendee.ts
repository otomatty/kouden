import { createClient } from "@/lib/supabase/server";

/**
 * Update an attendee by ID.
 * @param data - Object containing id and fields to update
 */
export async function updateAttendee(data: {
	id: string;
	name?: string;
	relation?: string;
	status?: string;
}) {
	const { id, ...payload } = data;
	const supabase = await createClient();
	const { data: attendee, error } = await supabase
		.schema("funeral")
		.from("attendees")
		.update(payload)
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return attendee;
}
