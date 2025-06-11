import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single shipping record by ID.
 * ID を指定して単一の配送情報を取得します。
 *
 * @param id - The shipping record ID.
 */
export async function getShipping(id: string) {
	const supabase = await createClient();
	const { data: shipping, error } = await supabase
		.schema("gift")
		.from("shipping")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return shipping;
}
