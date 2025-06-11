import { createClient } from "@/lib/supabase/server";

/**
 * Create a new permission.
 * 新しい権限を作成します。
 *
 * @param data - Object containing action and resource.
 */
export async function createPermission(data: {
	action: string;
	resource: string;
}) {
	const supabase = await createClient();
	const { data: permission, error } = await supabase
		.schema("common")
		.from("permissions")
		.insert({ action: data.action, resource: data.resource })
		.select()
		.single();
	if (error) throw error;
	return permission;
}
