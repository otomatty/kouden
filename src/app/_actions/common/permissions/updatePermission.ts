import { createClient } from "@/lib/supabase/server";

/**
 * Update an existing permission by ID.
 * ID を指定して既存の権限を更新します。
 *
 * @param data - Object containing id and fields to update.
 */
export async function updatePermission(data: {
	id: string;
	action?: string;
	resource?: string;
}) {
	const { id, action, resource } = data;
	const supabase = await createClient();
	const { data: permission, error } = await supabase
		.schema("common")
		.from("permissions")
		.update({
			...(action !== undefined && { action }),
			...(resource !== undefined && { resource }),
		})
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return permission;
}
