import { createClient } from "@/lib/supabase/server";

/**
 * Delete a promotion by ID.
 * ID を指定してプロモーションを削除します。
 *
 * @param id - The promotion ID.
 */
export async function deletePromotion(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("gift").from("promotions").delete().eq("id", id);
	if (error) throw error;
	return true;
}
