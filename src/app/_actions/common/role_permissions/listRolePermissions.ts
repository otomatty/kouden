import { createClient } from "@/lib/supabase/server";

/**
 * Fetch permissions assigned to a role.
 * 役割に割り当てられた権限を取得します。
 *
 * @param roleId - The role ID.
 */
export async function listRolePermissions(roleId: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.schema("common")
		.from("role_permissions")
		.select("*")
		.eq("role_id", roleId);
	if (error) throw error;
	return data;
}
