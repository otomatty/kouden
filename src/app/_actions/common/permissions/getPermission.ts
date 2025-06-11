import { createClient } from "@/lib/supabase/server";

/**
 * Fetch a single permission by ID.
 * ID を指定して単一の権限を取得します。
 *
 * @param id - The permission ID.
 */
export async function getPermission(id: string) {
	const supabase = await createClient();
	const { data: permission, error } = await supabase
		.schema("common")
		.from("permissions")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return permission;
}
