"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Record a new donation for a funeral case.
 * @param data - Details of the donation to add
 */
export async function recordDonation(data: {
	caseId: string;
	donorName: string;
	amount: number;
	receivedAt?: string;
}) {
	const supabase = await createClient();

	// Get organization_id from the case
	const { data: caseData, error: caseError } = await supabase
		.schema("funeral")
		.from("cases")
		.select("organization_id")
		.eq("id", data.caseId)
		.single();

	if (caseError) throw caseError;

	const { data: donation, error } = await supabase
		.schema("funeral")
		.from("donations")
		.insert({
			organization_id: caseData.organization_id,
			case_id: data.caseId,
			donor_name: data.donorName,
			amount: data.amount,
			received_at: data.receivedAt,
		})
		.select()
		.single();
	if (error) throw error;
	return donation;
}
