"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Delete a funeral case by ID.
 * @param id - The case ID
 */
export async function deleteCase(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("funeral").from("cases").delete().eq("id", id);
	if (error) throw error;
	return true;
}
