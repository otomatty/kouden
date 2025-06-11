import { createClient } from "@/lib/supabase/server";

/**
 * Delete a shipping record by ID.
 * ID を指定して配送情報を削除します。
 *
 * @param id - The shipping record ID.
 */
export async function deleteShipping(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("gift").from("shipping").delete().eq("id", id);
	if (error) throw error;
	return true;
}
