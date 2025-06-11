import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single role by ID.
 * @param id - The role ID
 */
export async function getRole(id: string) {
	const supabase = await createClient();
	const { data: role, error } = await supabase
		.schema("common")
		.from("roles")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return role;
}
