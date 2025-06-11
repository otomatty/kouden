import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing promotion by ID.
 * ID を指定して既存のプロモーションを更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updatePromotion(data: {
	id: string;
	code?: string;
	discountType?: string;
	discountValue?: number;
	expiresAt?: string;
}) {
	const { id, code, discountType, discountValue, expiresAt } = data;
	const supabase = await createClient();
	const { data: promotion, error } = await supabase
		.schema("gift")
		.from("promotions")
		.update({
			...(code !== undefined && { code }),
			...(discountType !== undefined && { discount_type: discountType }),
			...(discountValue !== undefined && { discount_value: discountValue }),
			...(expiresAt !== undefined && { expires_at: expiresAt }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return promotion;
}
