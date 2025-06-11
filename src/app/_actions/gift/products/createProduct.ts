import { createClient } from "@/lib/supabase/server";

/**
 * Create a new product.
 * 新しい商品を作成します。
 *
 * @param data - Object containing organizationId, name, description?, price, sku?.
 */
export async function createProduct(data: {
	organizationId: string;
	name: string;
	description?: string;
	price: number;
	sku?: string;
}) {
	const supabase = await createClient();
	const { data: product, error } = await supabase
		.schema("gift")
		.from("products")
		.insert({
			organization_id: data.organizationId,
			name: data.name,
			description: data.description,
			price: data.price,
			sku: data.sku,
		})
		.select()
		.single();
	if (error) throw error;
	return product;
}
