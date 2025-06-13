"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Delete an attendee by ID.
 * @param id - The attendee ID
 */
export async function deleteAttendee(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("funeral").from("attendees").delete().eq("id", id);
	if (error) throw error;
	return true;
}
