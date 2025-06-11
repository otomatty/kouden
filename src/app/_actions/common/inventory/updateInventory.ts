import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing inventory item by ID.
 * @param data - Object containing id and fields to update
 */
export async function updateInventory(data: {
	id: string;
	item?: string;
	stockLevel?: number;
}) {
	const { id, item, stockLevel } = data;
	const supabase = await createClient();
	const { data: inventory, error } = await supabase
		.schema("common")
		.from("inventory")
		.update({
			...(item !== undefined && { item }),
			...(stockLevel !== undefined && { stock_level: stockLevel }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return inventory;
}
