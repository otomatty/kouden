import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single loyalty point record by ID.
 * ID を指定して単一のロイヤルティポイントレコードを取得します。
 *
 * @param id - The loyalty point record ID.
 */
export async function getLoyaltyPoint(id: string) {
	const supabase = await createClient();
	const { data: record, error } = await supabase
		.schema("gift")
		.from("loyalty_points")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return record;
}
