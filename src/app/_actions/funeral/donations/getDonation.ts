"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single donation by ID.
 * @param id - The donation ID
 */
export async function getDonation(id: string) {
	const supabase = await createClient();
	const { data: donation, error } = await supabase
		.schema("funeral")
		.from("donations")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return donation;
}
