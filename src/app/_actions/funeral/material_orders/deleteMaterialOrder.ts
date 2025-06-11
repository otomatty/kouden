import { createClient } from "@/lib/supabase/server";

/**
 * Delete a material order by ID.
 * ID を指定して資材発注を削除します。
 *
 * @param id - The material order ID.
 */
export async function deleteMaterialOrder(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("funeral").from("material_orders").delete().eq("id", id);
	if (error) throw error;
	return true;
}
