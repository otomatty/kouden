import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single product by ID.
 * ID を指定して単一の商品を取得します。
 *
 * @param id - The product ID.
 */
export async function getProduct(id: string) {
	const supabase = await createClient();
	const { data: product, error } = await supabase
		.schema("gift")
		.from("products")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return product;
}
