import { createClient } from "@/lib/supabase/server";

/**
 * Delete a role by ID.
 * @param id - The role ID
 */
export async function deleteRole(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("common").from("roles").delete().eq("id", id);
	if (error) throw error;
	return true;
}
