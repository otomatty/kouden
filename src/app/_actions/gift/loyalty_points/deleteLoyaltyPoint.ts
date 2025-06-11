import { createClient } from "@/lib/supabase/server";

/**
 * Delete a loyalty point record by ID.
 * ID を指定してロイヤルティポイントレコードを削除します。
 *
 * @param id - The loyalty point record ID.
 */
export async function deleteLoyaltyPoint(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("gift").from("loyalty_points").delete().eq("id", id);
	if (error) throw error;
	return true;
}
