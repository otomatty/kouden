import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing customer by ID.
 * @param data - Object containing id and fields to update
 */
export async function updateCustomer(data: {
	id: string;
	name?: string;
	email?: string;
	phone?: string;
}) {
	const { id, ...payload } = data;
	const supabase = await createClient();
	const { data: customer, error } = await supabase
		.schema("common")
		.from("customers")
		.update(payload)
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return customer;
}
