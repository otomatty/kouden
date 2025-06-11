import { createClient } from "@/lib/supabase/server";

/**
 * Remove a permission from a role.
 * 役割から権限を解除します。
 *
 * @param data - Object containing roleId and permissionId.
 */
export async function deleteRolePermission(data: {
	roleId: string;
	permissionId: string;
}) {
	const supabase = await createClient();
	const { error } = await supabase
		.schema("common")
		.from("role_permissions")
		.delete()
		.eq("role_id", data.roleId)
		.eq("permission_id", data.permissionId);
	if (error) throw error;
	return true;
}
