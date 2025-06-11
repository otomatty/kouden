import { createClient } from "@/lib/supabase/server";

/**
 * Create a new contact record.
 * @param data - Details of the contact to create
 */
export async function createContact(data: {
	organizationId: string;
	customerId: string;
	type: string;
	template: string;
	lastSentAt?: string;
}) {
	const supabase = await createClient();
	const { data: contact, error } = await supabase
		.schema("funeral")
		.from("contacts")
		.insert({
			organization_id: data.organizationId,
			customer_id: data.customerId,
			type: data.type,
			template: data.template,
			last_sent_at: data.lastSentAt,
		})
		.select()
		.single();
	if (error) throw error;
	return contact;
}
