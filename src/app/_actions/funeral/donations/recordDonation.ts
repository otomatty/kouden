import { createClient } from "@/lib/supabase/server";

/**
 * Record a new donation for a funeral case.
 * @param data - Details of the donation to add
 */
export async function recordDonation(data: {
	organizationId: string;
	caseId: string;
	donorName: string;
	amount: number;
	receivedAt?: string;
}) {
	const supabase = await createClient();
	const { data: donation, error } = await supabase
		.schema("funeral")
		.from("donations")
		.insert({
			organization_id: data.organizationId,
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
