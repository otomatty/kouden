import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single attendee by ID.
 * @param id - The attendee ID
 */
export async function getAttendee(id: string) {
	const supabase = await createClient();
	const { data: attendee, error } = await supabase
		.schema("funeral")
		.from("attendees")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return attendee;
}
