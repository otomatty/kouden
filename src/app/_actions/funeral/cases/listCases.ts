"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * List all funeral cases for the current organization.
 */
export async function listCases() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("funeral").from("cases").select("*");
	if (error) throw error;
	return data;
}
