"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Update a donation by ID.
 * @param data - Object containing id and fields to update
 */
export async function updateDonation(data: {
	id: string;
	donorName?: string;
	amount?: number;
	receivedAt?: string;
}) {
	const { id, donorName, amount, receivedAt } = data;
	const supabase = await createClient();
	const { data: donation, error } = await supabase
		.schema("funeral")
		.from("donations")
		.update({
			...(donorName !== undefined && { donor_name: donorName }),
			...(amount !== undefined && { amount }),
			...(receivedAt !== undefined && { received_at: receivedAt }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return donation;
}
