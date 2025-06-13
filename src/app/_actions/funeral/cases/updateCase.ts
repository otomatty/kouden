"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Update a funeral case by ID.
 * @param data - Object containing id and fields to update
 */
export async function updateCase(data: {
	id: string;
	deceased_name?: string;
	venue?: string;
	start_datetime?: string;
	status?: string;
}) {
	const { id, ...payload } = data;
	const supabase = await createClient();
	const { data: caseRecord, error } = await supabase
		.schema("funeral")
		.from("cases")
		.update(payload)
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return caseRecord;
}
