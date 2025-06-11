import { createClient } from "@/lib/supabase/server";

/**
 * Create a new role.
 * @param data - Object containing name of the role.
 */
export async function createRole(data: { name: string }) {
	const supabase = await createClient();
	const { data: role, error } = await supabase
		.schema("common")
		.from("roles")
		.insert({ name: data.name })
		.select()
		.single();
	if (error) throw error;
	return role;
}
