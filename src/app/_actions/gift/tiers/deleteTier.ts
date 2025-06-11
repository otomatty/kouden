import { createClient } from "@/lib/supabase/server";

/**
 * Delete a tier by ID.
 * ID を指定してティアを削除します。
 *
 * @param id - The tier ID.
 */
export async function deleteTier(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("gift").from("tiers").delete().eq("id", id);
	if (error) throw error;
	return true;
}
