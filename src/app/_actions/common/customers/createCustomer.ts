import { createClient } from "@/lib/supabase/server";

/**
 * Create a new customer.
 */
export async function createCustomer(data: {
	name: string;
	email: string;
	phone?: string;
	organizationId: string;
}) {
	const supabase = await createClient();
	const { data: customer, error } = await supabase
		.schema("common")
		.from("customers")
		.insert({ ...data, organization_id: data.organizationId })
		.select()
		.single();
	if (error) throw error;
	return customer;
}
