import { createClient } from "@/lib/supabase/server";

/**
 * Create a new funeral case.
 */
export async function createCase(data: {
	customer_id: string;
	deceased_name: string;
	venue?: string;
	start_datetime?: string; // ISO timestamp
	status?: string;
	organizationId: string;
}) {
	const supabase = await createClient();
	const { data: caseRecord, error } = await supabase
		.schema("funeral")
		.from("cases")
		.insert({ ...data, organization_id: data.organizationId })
		.select()
		.single();
	if (error) throw error;
	return caseRecord;
}
