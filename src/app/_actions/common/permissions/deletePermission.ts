import { createClient } from "@/lib/supabase/server";

/**
 * Delete a permission by ID.
 * ID を指定して権限を削除します。
 *
 * @param id - The permission ID.
 */
export async function deletePermission(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("common").from("permissions").delete().eq("id", id);
	if (error) throw error;
	return true;
}
