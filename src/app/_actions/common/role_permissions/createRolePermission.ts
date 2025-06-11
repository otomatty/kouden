import { createClient } from "@/lib/supabase/server";

/**
 * Assign a permission to a role.
 * 権限を役割に割り当てます。
 *
 * @param data - Object containing roleId and permissionId.
 */
export async function createRolePermission(data: {
	roleId: string;
	permissionId: string;
}) {
	const supabase = await createClient();
	const { data: mapping, error } = await supabase
		.schema("common")
		.from("role_permissions")
		.insert({ role_id: data.roleId, permission_id: data.permissionId })
		.select()
		.single();
	if (error) throw error;
	return mapping;
}
