import { createClient } from "@/lib/supabase/server";

/**
 * Delete an order by ID.
 * ID を指定して注文を削除します。
 *
 * @param id - The order ID.
 */
export async function deleteOrder(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("gift").from("orders").delete().eq("id", id);
	if (error) throw error;
	return true;
}
