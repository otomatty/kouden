import { createClient } from "@/lib/supabase/server";

/**
 * Delete a product by ID.
 * ID を指定して商品を削除します。
 *
 * @param id - The product ID.
 */
export async function deleteProduct(id: string) {
	const supabase = await createClient();
	const { error } = await supabase.schema("gift").from("products").delete().eq("id", id);
	if (error) throw error;
	return true;
}
