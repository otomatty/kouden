import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing role by ID.
 * @param data - Object containing id and fields to update
 */
export async function updateRole(data: { id: string; name?: string }) {
	const { id, name } = data;
	const supabase = await createClient();
	const { data: role, error } = await supabase
		.schema("common")
		.from("roles")
		.update({ ...(name !== undefined && { name }) })
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return role;
}
