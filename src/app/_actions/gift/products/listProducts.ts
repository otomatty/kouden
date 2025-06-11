import { createClient } from "@/lib/supabase/server";

/**
 * Fetch list of products.
 * 商品の一覧を取得します。
 *
 * @returns Array of products.
 */
export async function listProducts() {
	const supabase = await createClient();
	const { data, error } = await supabase.schema("gift").from("products").select("*");
	if (error) throw error;
	return data;
}
