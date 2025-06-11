import { createClient } from "@/lib/supabase/server";

/**
 * Create a new loyalty point record.
 * 新しいロイヤルティポイントレコードを作成します。
 *
 * @param data - Object containing organizationId, customerId, points, expiresAt?.
 */
export async function createLoyaltyPoint(data: {
	organizationId: string;
	customerId: string;
	points: number;
	expiresAt?: string;
}) {
	const supabase = await createClient();
	const { data: record, error } = await supabase
		.schema("gift")
		.from("loyalty_points")
		.insert({
			organization_id: data.organizationId,
			customer_id: data.customerId,
			points: data.points,
			expires_at: data.expiresAt,
		})
		.select()
		.single();
	if (error) throw error;
	return record;
}
