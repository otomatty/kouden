import { createClient } from "@/lib/supabase/server";

/**
 * Create a new promotion.
 * 新しいプロモーションを作成します。
 *
 * @param data - Object containing organizationId, code, discountType?, discountValue?, expiresAt?.
 */
export async function createPromotion(data: {
	organizationId: string;
	code: string;
	discountType?: string;
	discountValue?: number;
	expiresAt?: string;
}) {
	const supabase = await createClient();
	const { data: promotion, error } = await supabase
		.schema("gift")
		.from("promotions")
		.insert({
			organization_id: data.organizationId,
			code: data.code,
			discount_type: data.discountType,
			discount_value: data.discountValue,
			expires_at: data.expiresAt,
		})
		.select()
		.single();
	if (error) throw error;
	return promotion;
}
