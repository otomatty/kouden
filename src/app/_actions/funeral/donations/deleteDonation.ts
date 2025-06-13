"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Delete a donation by ID.
 * @param id - The donation ID
 */
export async function deleteDonation(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("funeral").from("donations").delete().eq("id", id);
	if (error) throw error;
	return true;
}
