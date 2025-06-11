import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single promotion by ID.
 * ID を指定して単一のプロモーションを取得します。
 *
 * @param id - The promotion ID.
 */
export async function getPromotion(id: string) {
	const supabase = await createClient();
	const { data: promotion, error } = await supabase
		.schema("gift")
		.from("promotions")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return promotion;
}
