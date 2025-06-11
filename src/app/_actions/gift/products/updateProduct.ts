import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing product by ID.
 * ID を指定して既存の商品を更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateProduct(data: {
	id: string;
	name?: string;
	description?: string;
	price?: number;
	sku?: string;
}) {
	const { id, name, description, price, sku } = data;
	const supabase = await createClient();
	const { data: product, error } = await supabase
		.schema("gift")
		.from("products")
		.update({
			...(name !== undefined && { name }),
			...(description !== undefined && { description }),
			...(price !== undefined && { price }),
			...(sku !== undefined && { sku }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return product;
}
