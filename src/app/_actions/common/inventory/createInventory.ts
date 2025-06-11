import { createClient } from "@/lib/supabase/server";

/**
 * Create a new inventory item.
 */
export async function createInventory(data: {
	organizationId: string;
	item: string;
	stockLevel: number;
}) {
	const supabase = await createClient();
	const { data: inventory, error } = await supabase
		.schema("common")
		.from("inventory")
		.insert({
			organization_id: data.organizationId,
			item: data.item,
			stock_level: data.stockLevel,
		})
		.select()
		.single();
	if (error) throw error;
	return inventory;
}
