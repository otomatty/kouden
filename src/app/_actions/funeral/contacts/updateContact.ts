import { createClient } from "@/lib/supabase/server";

/**
 * Update a contact record by ID.
 * @param data - Object containing id and fields to update
 */
export async function updateContact(data: {
	id: string;
	type?: string;
	template?: string;
	lastSentAt?: string;
}) {
	const { id, type, template, lastSentAt } = data;
	const supabase = await createClient();
	const { data: contact, error } = await supabase
		.schema("funeral")
		.from("contacts")
		.update({
			...(type !== undefined && { type }),
			...(template !== undefined && { template }),
			...(lastSentAt !== undefined && { last_sent_at: lastSentAt }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return contact;
}
