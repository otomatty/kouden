import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of roles for the current organization.
 */
export async function listRoles() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("common").from("roles").select("*");
	if (error) throw error;
	return data;
}
