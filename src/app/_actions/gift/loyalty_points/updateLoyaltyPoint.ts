import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing loyalty point record by ID.
 * ID を指定して既存のロイヤルティポイントレコードを更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updateLoyaltyPoint(data: {
	id: string;
	points?: number;
	expiresAt?: string;
}) {
	const { id, points, expiresAt } = data;
	const supabase = await createClient();
	const { data: record, error } = await supabase
		.schema("gift")
		.from("loyalty_points")
		.update({
			...(points !== undefined && { points }),
			...(expiresAt !== undefined && { expires_at: expiresAt }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return record;
}
