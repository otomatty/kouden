import { createClient } from "@/lib/supabase/server";

/**
 * Create a new tier.
 * 新しいティアを作成します。
 *
 * @param data - Object containing organizationId, name, threshold.
 */
export async function createTier(data: {
	organizationId: string;
	name: string;
	threshold: number;
}) {
	const supabase = await createClient();
	const { data: tier, error } = await supabase
		.schema("gift")
		.from("tiers")
		.insert({
			organization_id: data.organizationId,
			name: data.name,
			threshold: data.threshold,
		})
		.select()
		.single();
	if (error) throw error;
	return tier;
}
